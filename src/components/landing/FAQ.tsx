'use client';

import { useState } from 'react';

const items = [
  {
    q: 'Is Sizzle really free?',
    a: 'Yes — the Basic plan is free forever for one business with no time limit. Sales tracking, expense logging, menu with recipe costing (up to 20 dishes), inventory, and 6-month reports are all included at no cost. Pro (₱399/mo) unlocks unlimited dishes, employees, payroll, waste log, and CSV exports. Premium (₱1,999/mo) adds multiple businesses and AI-powered insights.',
  },
  {
    q: 'Do I need a credit card to sign up?',
    a: 'No. You create an account with just your email. No payment information is collected until you choose to upgrade to Pro.',
  },
  {
    q: 'Is my data safe?',
    a: 'All data is stored in a secure PostgreSQL database with row-level security — meaning your data is completely isolated from other accounts. Connections are encrypted. We never sell or share your data.',
  },
  {
    q: 'Does it work offline or on mobile?',
    a: "Sizzle works in any modern browser on desktop, tablet, or phone. You can also install it as a PWA (progressive web app) on Android or desktop — just tap 'Install' in the Settings page. A basic offline fallback is available so you're not left with a blank screen if your connection drops.",
  },
  {
    q: 'Can I manage more than one business?',
    a: 'Multiple venues are a Premium feature. Basic and Pro support one business each. Premium lets you manage as many businesses as you need from a single account.',
  },
  {
    q: 'How does recipe costing work?',
    a: 'You add your ingredients with their unit cost (e.g., chicken breast at ₱280/kg). Then you build a recipe — how much of each ingredient goes into one serving of a dish. Sizzle calculates the exact food cost per plate and your gross margin. When you log a sale, the recipe quantities are automatically deducted from your inventory.',
  },
  {
    q: 'Can I cancel or downgrade anytime?',
    a: "Yes. If you're on Pro and want to go back to Starter, you can downgrade from the Settings page at any time. There are no long-term contracts or cancellation fees.",
  },
  {
    q: 'Why is Sizzle built specifically for the Philippines?',
    a: 'Pricing is in Philippine Peso, the workflow is designed around how local restaurants and cafés actually operate, and the default themes were chosen with Filipino café aesthetics in mind. The target revenue goals, expense categories, and even the sample data use locally relevant numbers.',
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
