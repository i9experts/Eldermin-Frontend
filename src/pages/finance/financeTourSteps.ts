import type { TourStep } from '../../components/tour/TourOverlay';

const TAB_DESCRIPTIONS: Record<string, string> = {
  dashboard: 'An overview of fee collection, receivables, and cash position at a glance.',
  fee: 'Set up Fee Structures - the rate card every invoice is generated from. Start here before anything else.',
  assignments: "Assign a different fee structure to a specific student, manage discounts & scholarships, and generate each month's challans (invoices).",
  receivable: 'See who owes what, and collect fee payments here.',
  defaulters: 'A focused, aging view of overdue families, with reminders and payment-plan commitments.',
  payable: 'Record and approve what the school owes vendors and suppliers.',
  vouchers: "Manual journal entries for anything that doesn't fit the standard flows, like a vendor refund.",
  banking: 'Your bank accounts, balances, and a quick manual reconciliation.',
  reconciliation: 'Line-by-line matching against an imported bank statement.',
  budgeting: 'Set and track budgets against actual spend.',
  islamic: 'Zakat and Islamic finance-specific fund tracking.',
  ledger: 'The full double-entry accounting ledger behind every transaction.',
  reports: 'Fee collection, income & expense, and other financial reports.',
  audit: 'An audit trail of changes across Finance.',
  'accounting-integrations': 'Sync with external accounting software.',
};

/** Builds the Finance module's own mini-tour from exactly the tabs this
 * user's role can see (visibleTabs, already filtered by the page itself
 * via canAccess('finance:view', tabId)) - same reuse principle as the
 * global tour reusing Sidebar's own filtered nav groups, so a Finance
 * Officer scoped to only a few sub-modules isn't shown steps for tabs
 * they can't actually open. */
export function buildFinanceTourSteps(visibleTabs: { id: string; label: string }[]): TourStep[] {
  return visibleTabs.map((tab) => ({
    target: `nav-tab-${tab.id}`,
    title: tab.label,
    content: TAB_DESCRIPTIONS[tab.id] ?? `The ${tab.label} tab.`,
  }));
}
