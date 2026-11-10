export type ModeAwareNavItem = {
  developerOnly?: boolean;
};

/** Hides developer-only entries when the app runs in monitoring mode. */
export function filterNavByMode<T extends ModeAwareNavItem>(
  items: T[],
  isMonitoring: boolean,
): T[] {
  return isMonitoring ? items.filter((item) => !item.developerOnly) : items;
}
