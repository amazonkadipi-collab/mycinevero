// Categories are intentionally empty while the site's taxonomy is being replaced.
export const VIDEO_CATEGORIES = [] as const;

export function getCategoryLabel(slug: string) {
  return slug.replace(/-/g, ' ');
}
