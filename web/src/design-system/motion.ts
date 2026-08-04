export const motion = {
  fast: 120,
  control: 160,
  panel: 220,
  route: 300,
  hero: 760,
} as const;

export const motionCss = {
  fast: `${motion.fast}ms`,
  control: `${motion.control}ms`,
  panel: `${motion.panel}ms`,
  route: `${motion.route}ms`,
  hero: `${motion.hero}ms`,
} as const;
