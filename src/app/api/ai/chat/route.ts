import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { requireVenue } from '@/lib/queries/auth'
import { isPremium } from '@/lib/plan'
import { db } from '@/lib/db'
import { accounts } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { AI_TOOLS, runTool } from '@/lib/ai/tools'

export const runtime = 'nodejs'
export const maxDuration = 60

// Generous Premium budget — 200k tokens/day per account
const DAILY_TOKEN_BUDGET = 200_000
const MODEL = 'claude-sonnet-4-6'

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

function todayInTz(tz: string): string {
  return new Date().toLocaleDateString('en-CA', { timeZone: tz })
}

function buildSystemPrompt(venueName: string, today: string, tz: string) {
  return `You are Sizzle Assistant, an analyst for the owner of "${venueName}", a Filipino food business.

Today is ${today} (${tz}). The venue uses PHP (₱). Reply in plain, concise English a non-technical owner can act on. Default to short answers — 1-3 sentences — unless the user asks for detail. Use ₱ for currency. Round to whole pesos unless the user asks for cents.

You have read-only access to the venue's sales, expenses, menu, inventory, payroll, and waste data through tools. Always call a tool to look up real numbers — never make them up. If a question is ambiguous (e.g. "this week"), pick the most natural date range and state which one you used.

When you compare periods (e.g. "vs last week"), call the same tool twice with two ranges. When the user asks "how am I doing?" without specifics, summarise today's revenue, this week's revenue vs last week, and any low-stock or food-cost concerns.

Be honest about what the numbers say. If profit is negative or food cost is high, name it. If something looks off, suggest what to check.`
}

export async function POST(req: NextRequest) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: 'AI is not configured.' }, { status: 503 })
  }

  const { account, venue } = await requireVenue()

  if (!isPremium(account)) {
    return NextResponse.json({ error: 'AI chat is a Premium feature.' }, { status: 403 })
  }

  const tz = venue.timezone || 'Asia/Manila'
  const today = todayInTz(tz)

  // Reset the daily counter when the date has rolled over (venue-local)
  const tokensUsedToday = account.aiTokensDate === today ? account.aiTokensToday : 0
  if (tokensUsedToday >= DAILY_TOKEN_BUDGET) {
    return NextResponse.json(
      { error: 'Daily AI quota reached. Resets at midnight (venue local time).' },
      { status: 429 },
    )
  }

  let body: { messages?: ChatMessage[] }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }
  const incoming = body.messages ?? []
  if (!Array.isArray(incoming) || incoming.length === 0) {
    return NextResponse.json({ error: 'No messages.' }, { status: 400 })
  }

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

  // Anthropic's typing for tool_use / tool_result content blocks is intentionally open;
  // we work with the structured blocks the SDK returns rather than re-declaring them.
  const conversation: Anthropic.MessageParam[] = incoming.map(m => ({
    role: m.role,
    content: m.content,
  }))

  let totalInputTokens = 0
  let totalOutputTokens = 0
  let finalText = ''
  // Hard cap on tool-use loops in case the model gets stuck
  const MAX_TURNS = 8

  for (let turn = 0; turn < MAX_TURNS; turn++) {
    const response = await client.messages.create({
      model: MODEL,
      max_tokens: 1024,
      // Cache system prompt + tool schemas so repeat calls only pay for the new user text
      system: [
        {
          type: 'text',
          text: buildSystemPrompt(venue.name, today, tz),
          cache_control: { type: 'ephemeral' },
        },
      ],
      tools: AI_TOOLS.map((t, idx) => ({
        ...t,
        // Mark the last tool with cache_control so the whole tools array is cached
        ...(idx === AI_TOOLS.length - 1 ? { cache_control: { type: 'ephemeral' as const } } : {}),
      })),
      messages: conversation,
    })

    totalInputTokens  += response.usage.input_tokens
    totalOutputTokens += response.usage.output_tokens

    if (response.stop_reason === 'tool_use') {
      // Append the model's tool_use turn to the conversation
      conversation.push({ role: 'assistant', content: response.content })

      // Run every requested tool in parallel, then send all results back in one user turn
      const toolUseBlocks = response.content.filter(
        (b): b is Anthropic.ToolUseBlock => b.type === 'tool_use',
      )
      const toolResults = await Promise.all(
        toolUseBlocks.map(async (block) => {
          try {
            const result = await runTool(
              block.name,
              block.input as Record<string, unknown>,
              { venueId: venue.id },
            )
            return {
              type: 'tool_result' as const,
              tool_use_id: block.id,
              content: JSON.stringify(result),
            }
          } catch (err) {
            return {
              type: 'tool_result' as const,
              tool_use_id: block.id,
              content: `Error: ${err instanceof Error ? err.message : String(err)}`,
              is_error: true,
            }
          }
        }),
      )
      conversation.push({ role: 'user', content: toolResults })
      continue
    }

    // End_turn (or any other stop) — pull the final text out
    finalText = response.content
      .filter((b): b is Anthropic.TextBlock => b.type === 'text')
      .map(b => b.text)
      .join('\n')
      .trim()
    break
  }

  // Persist the usage delta against the venue-local day
  const totalTokens = totalInputTokens + totalOutputTokens
  await db.update(accounts)
    .set({
      aiTokensToday: tokensUsedToday + totalTokens,
      aiTokensDate:  today,
    })
    .where(eq(accounts.id, account.id))

  return NextResponse.json({
    message: finalText || 'I couldn\'t produce a response. Try rephrasing your question.',
    tokens_used_today: tokensUsedToday + totalTokens,
    tokens_remaining_today: Math.max(0, DAILY_TOKEN_BUDGET - tokensUsedToday - totalTokens),
  })
}
