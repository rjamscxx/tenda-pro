'use client';

import { useState } from 'react';

const items = [
  {
    q: 'Is Tenda Pro really free?',
    a: 'Yes — the Basic plan is free forever for one business with no time limit. Sales tracking, expense logging, menu with recipe costing (up to 20 dishes), inventory, and 6-month reports are all included at no cost. Pro (₱399/mo or ₱4,000/yr) unlocks unlimited dishes, employees, payroll, waste log, advanced analytics, forecasting, daily digest email, and CSV exports.',
  },
  {
    q: 'Do I need a credit card to sign up?',
    a: 'No. You create an account with just your email. No payment information is collected until you choose to upgrade to Pro, and even then we accept GCash, Maya, GrabPay, card, and bank transfer through PayMongo.',
  },
  {
    q: 'How do I pay? Does it support GCash and Maya?',
    a: 'Yes — Pro subscriptions are billed through PayMongo. You can pay with GCash, Maya, GrabPay, credit/debit card, or direct bank transfer. Choose monthly (₱399/mo) or annual (₱4,000/yr) — no contracts, cancel anytime.',
  },
  {
    q: 'Does Tenda Pro issue official BIR receipts?',
    a: 'Not yet. Tenda Pro handles your internal numbers — what you sold, what you spent, what your real margin is. For customer-facing official receipts you still use your existing BIR-registered receipt printer or pad. This is on the roadmap.',
  },
  {
    q: 'What if my internet goes down mid-shift?',
    a: "Tenda Pro is a PWA, so the app shell stays loaded even on a flaky connection. Live sales/expense logging needs the network to talk to the database, so during a full outage we recommend the classic backup — paper sales slips you log into Tenda Pro once you're back online. Full offline mode is on the roadmap.",
  },
  {
    q: 'Can I import my data from Excel or another tool?',
    a: "Not yet — entries are added through the app's forms today. CSV import for ingredients, dishes, and historical sales is on the near-term roadmap. If you have specific data you need imported to get started, message me directly at rjamscxx@gmail.com and I'll help.",
  },
  {
    q: 'Is my data safe? Can I export it?',
    a: 'All data is stored in a secure PostgreSQL database (Supabase) with row-level security — your data is completely isolated from other accounts. Connections are encrypted. You can export any report to CSV from the Reports page, and Tenda Pro never sells or shares your data.',
  },
  {
    q: 'Does it work on mobile?',
    a: "Yes. Tenda Pro works in any modern browser on desktop, tablet, or phone. You can install it as a PWA on Android or desktop — tap 'Install' in the Settings page and you get a home-screen icon that opens like a native app.",
  },
  {
    q: 'How does recipe costing work?',
    a: 'You add your ingredients with their unit cost (e.g., chicken breast at ₱280/kg). Then you build a recipe — how much of each ingredient goes into one serving of a dish. Tenda Pro calculates the exact food cost per plate and your gross margin. When you log a sale, the recipe quantities are automatically deducted from your inventory.',
  },
  {
    q: 'How is this different from Square or a regular POS?',
    a: "A POS records sales. Tenda Pro records sales AND tells you whether you actually made money — by tracking your real food cost per dish, your expenses, your waste, and your payroll alongside your revenue. Square's strength is hardware integration and card processing; Tenda Pro's strength is the back-of-house numbers Square can't see.",
  },
  {
    q: 'Can I cancel or downgrade anytime?',
    a: "Yes. If you're on Pro and want to go back to Basic, you can downgrade from the Settings page at any time. There are no long-term contracts or cancellation fees. Your historical data stays intact and remains exportable.",
  },
  {
    q: 'Why is Tenda Pro built specifically for the Philippines?',
    a: 'Pricing is in Philippine Peso, the workflow is designed around how local restaurants and cafés actually operate, and the default themes were chosen with Filipino café aesthetics in mind. Built by a Filipino indie developer, not a foreign SaaS team adapting their product.',
  },
];

export default function FAQ() {
  const [open, setOpen] = useState<number | null>(null);

  const toggle = (index: number) => {
    setOpen((prev) => (prev === index ? null : index));
  };

  return (
    <>
      <p className="text-xs text-accent font-semibold uppercase tracking-widest mb-3">
        Common questions
      </p>
      <h2 className="text-[clamp(2rem,4vw,3.2rem)] font-semibold tracking-tighter text-ink leading-tight max-w-[28ch]">
        Everything you need to know.
      </h2>

      <div className="mt-10">
        {items.map((item, index) => {
          const isOpen = open === index;
          const isLast = index === items.length - 1;

          return (
            <div
              key={index}
              className={`border-t border-hair${isLast ? ' border-b border-hair' : ''}`}
            >
              <button
                className="w-full flex justify-between items-center py-5 text-left"
                onClick={() => toggle(index)}
                aria-expanded={isOpen}
              >
                <span className="text-sm font-medium text-ink">{item.q}</span>
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 16 16"
                  fill="none"
                  className={`shrink-0 text-ink-4 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
                >
                  <path
                    d="M4 6l4 4 4-4"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>

              <div
                className={`overflow-hidden transition-all duration-300 ${isOpen ? 'max-h-96' : 'max-h-0'}`}
              >
                <p className="pb-5 text-sm text-ink-3 leading-relaxed">{item.a}</p>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
