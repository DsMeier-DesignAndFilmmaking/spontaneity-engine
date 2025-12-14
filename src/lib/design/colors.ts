/**
 * colors.ts
 * Navigator Color Palette - Design Tokens
 * 
 * Project-wide color system with semantic naming for brand, accents, text, 
 * background, and UI state colors. Ready for Tailwind, CSS variables, or 
 * design token integration.
 */

/**
 * Core Brand Colors
 */
export const brand = {
  /** Primary Accent: Deep Navy Blue (#1D4289) - Primary CTAs, branding, key navigational highlights, B2B dashboards - AAA Highly accessible (9.1:1 contrast ratio) */
  primary: '#1D4289',
  
  /** Secondary Accent: Chartreuse Green (#7FFF00) - Success messages, optimal routes, savings, highlighted actions */
  secondary: '#7FFF00',
  
  /** Base Background: Off-White/Clean White (#FAFAFA) - Provides clean, modern canvas that is softer than pure white */
  base: '#FAFAFA',
  
  /** Neutral Text: Dark Gray/Black (#222222) - Primary body text, headings, titles, documentation - AAA contrast against Off-White background */
  text: '#222222',
} as const;

/**
 * Supporting Colors / UI States
 */
export const ui = {
  /** Hover / Interactive: Dark Indigo (#16336B) - Button hover, tab hover, Quick Actions hover - AAA Highly accessible (11.2:1 contrast ratio) */
  hover: '#16336B',
  
  /** Focus / Selected: Medium Chartreuse (#9AFF33) - Selected dropdown items, selected vibes/chips, interactive highlights */
  focus: '#9AFF33',
  
  /** Disabled / Inactive: Cool Gray (#D3D3D3) - Disabled buttons, inactive inputs */
  disabled: '#D3D3D3',
  
  /** Borders / Dividers: Gray (#E0E0E0) - Card borders, panels, input borders */
  border: '#E0E0E0',
  
  /** Background Accent: Very Light Blue (#EDF4FF) - Secondary panels, tooltips, hover card backgrounds */
  bgAccent: '#EDF4FF',
} as const;

/**
 * Semantic Color Tokens
 * 
 * Use these semantic names throughout the application for consistent theming.
 */
export const colors = {
  // Brand
  primary: brand.primary,
  secondary: brand.secondary,
  
  // Text
  textPrimary: brand.text,
  textSecondary: '#4B5563', // Muted text variant
  textMuted: '#9CA3AF', // Very muted text
  textInverse: '#FFFFFF', // White text for dark backgrounds
  
  // Background
  bgBase: brand.base,
  bgPrimary: '#FAFAFA', // Off-White/Clean White background for cards
  bgAccent: ui.bgAccent,
  bgHover: '#F3F4F6', // Subtle hover background
  
  // Interactive States
  hover: ui.hover,
  focus: ui.focus,
  active: brand.primary, // Active state uses primary
  selected: ui.focus, // Selected items use focus color
  
  // UI Elements
  border: ui.border,
  borderFocus: brand.primary, // Focused borders use primary
  disabled: ui.disabled,
  
  // Status Colors (extending the palette)
  success: '#15803D', // Dark green for success - ADA compliant (WCAG AA: 4.5:1+ contrast)
  error: '#DC2626', // Red for errors (standard)
  warning: '#F59E0B', // Amber for warnings (standard)
  info: brand.primary, // Primary for info
} as const;

/**
 * Color palette export for easy import
 */
export default colors;

/**
 * Type exports for TypeScript
 */
export type ColorToken = typeof colors[keyof typeof colors];
export type BrandColor = typeof brand[keyof typeof brand];
export type UIColor = typeof ui[keyof typeof ui];

