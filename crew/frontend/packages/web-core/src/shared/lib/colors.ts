// Predefined color palette for projects and tags (HSL format)
// Modern, vibrant colors with good differentiation
export const PRESET_COLORS = [
  '0 84% 60%', // Coral Red - vibrant, warm
  '24 95% 53%', // Tangerine - energetic orange
  '45 93% 58%', // Golden Yellow - bright, optimistic
  '158 64% 52%', // Mint Green - fresh, modern
  '200 98% 39%', // Ocean Blue - professional, calm
  '271 81% 56%', // Vivid Purple - creative, modern
  '330 81% 60%', // Hot Pink - bold, playful
  '183 74% 44%', // Teal - sophisticated
  '262 52% 47%', // Indigo - deep, elegant
  '142 71% 45%', // Emerald - nature, growth
  '17 88% 40%', // Rust - warm, earthy
  '231 48% 48%', // Slate Blue - professional
] as const;

export type PresetColor = (typeof PRESET_COLORS)[number];

/**
 * Get a random color from the preset palette
 */
export function getRandomPresetColor(): string {
  return PRESET_COLORS[Math.floor(Math.random() * PRESET_COLORS.length)];
}
