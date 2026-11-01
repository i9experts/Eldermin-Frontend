import type { TourStep } from './TourOverlay';

/** Shared by every module's own "Show Me Around" mini-tour (see
 * ModuleTourButton): one step per visible tab - already role-filtered by
 * the module's own page, same as the global tour reusing Sidebar's
 * filtered nav groups - using a plain-English description per tab id,
 * with a generic fallback for any tab id not covered so a newly added tab
 * never silently gets a blank step. */
export function buildModuleTourSteps(
  visibleTabs: { id: string; label: string }[],
  descriptions: Record<string, string>,
): TourStep[] {
  return visibleTabs.map((tab) => ({
    target: `nav-tab-${tab.id}`,
    title: tab.label,
    content: descriptions[tab.id] ?? `The ${tab.label} tab.`,
  }));
}
