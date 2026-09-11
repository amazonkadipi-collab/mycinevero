export const VIDEO_CATEGORIES = [
  ['amateur', 'Amateur'],
  ['anal', 'Anal'],
  ['asian', 'Asian'],
  ['bbw', 'BBW'],
  ['big tits', 'Big Tits'],
  ['blonde', 'Blonde'],
  ['brunette', 'Brunette'],
  ['cosplay', 'Cosplay'],
  ['couples', 'Couples'],
  ['gay', 'Gay'],
  ['lesbian', 'Lesbian'],
  ['mature', 'Mature'],
  ['milf', 'MILF'],
  ['public', 'Public'],
  ['redhead', 'Redhead'],
  ['solo', 'Solo'],
  ['threesome', 'Threesome'],
  ['vintage', 'Vintage'],
  ['webcam', 'Webcam'],
] as const;

export function getCategoryLabel(slug: string) {
  return VIDEO_CATEGORIES.find(([value]) => value === slug)?.[1] || slug.replace(/-/g, ' ');
}
