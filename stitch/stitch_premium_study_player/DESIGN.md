---
name: Premium Scholar
colors:
  surface: '#111317'
  surface-dim: '#111317'
  surface-bright: '#37393e'
  surface-container-lowest: '#0c0e12'
  surface-container-low: '#1a1c20'
  surface-container: '#1e2024'
  surface-container-high: '#282a2e'
  surface-container-highest: '#333539'
  on-surface: '#e2e2e8'
  on-surface-variant: '#c1c6d7'
  inverse-surface: '#e2e2e8'
  inverse-on-surface: '#2f3035'
  outline: '#8b90a0'
  outline-variant: '#414755'
  surface-tint: '#adc6ff'
  primary: '#adc6ff'
  on-primary: '#002e69'
  primary-container: '#4b8eff'
  on-primary-container: '#00285c'
  inverse-primary: '#005bc1'
  secondary: '#c2c1ff'
  on-secondary: '#1800a7'
  secondary-container: '#3630bf'
  on-secondary-container: '#b1b1ff'
  tertiary: '#42e355'
  on-tertiary: '#00390a'
  tertiary-container: '#00a82f'
  on-tertiary-container: '#003208'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#d8e2ff'
  primary-fixed-dim: '#adc6ff'
  on-primary-fixed: '#001a41'
  on-primary-fixed-variant: '#004493'
  secondary-fixed: '#e2dfff'
  secondary-fixed-dim: '#c2c1ff'
  on-secondary-fixed: '#0c006b'
  on-secondary-fixed-variant: '#332dbc'
  tertiary-fixed: '#70ff76'
  tertiary-fixed-dim: '#42e355'
  on-tertiary-fixed: '#002204'
  on-tertiary-fixed-variant: '#005313'
  background: '#111317'
  on-background: '#e2e2e8'
  surface-variant: '#333539'
typography:
  display-lg:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.01em
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  label-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 20px
    letterSpacing: 0.01em
  label-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.05em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 8px
  xs: 4px
  sm: 12px
  md: 24px
  lg: 40px
  xl: 64px
  container-margin: 24px
  gutter: 16px
---

## Brand & Style

The design system is centered on the concept of "Deep Focus." It targets serious learners and professionals who require an environment free from visual noise. The personality is sophisticated, academic, and technologically advanced. 

The aesthetic blends **Modern Corporate** structure with **Glassmorphism** accents. By utilizing semi-transparent layers and subtle backdrop blurs, the design system creates a sense of depth without relying on heavy shadows. The primary goal is to foster an immersive "flow state," where the interface recedes to let the educational content take center stage. Every interaction is designed to feel tactile and intentional, reinforcing a sense of premium quality.

## Colors

The palette is built upon a foundation of "Deep Charcoal" and "Slate" to reduce eye strain during long study sessions. 

- **Primary Canvas:** #0F1115 provides a near-black base that makes content pop.
- **Surface Elevation:** Use #1C1F26 for card elements and containers.
- **Accents:** The primary blue (#007AFF) is reserved for critical actions, progress indicators, and active states. 
- **Feedback:** Use #32D74B for success/correct answers and #FF453A for errors or "retry" states, maintaining high saturation to ensure visibility against the dark backdrop.
- **Glass Effects:** Use white or primary color at 8-12% opacity with a 20px background blur for floating elements.

## Typography

The design system exclusively utilizes **Inter** to ensure maximum legibility and a systematic, utilitarian feel. 

Typography is hierarchical and sparse. High-contrast ratios between headings (Pure White) and body text (Slate-300/400) guide the eye naturally through the study material. Use medium and semi-bold weights for interactive labels to ensure they remain legible even at smaller sizes or within glass-morphic containers. Letter spacing is slightly tightened on large headings for a "premium" editorial feel and loosened on small labels for clarity.

## Layout & Spacing

This design system employs a **Fluid Grid** with a 12-column structure for desktop and a single-column stack for mobile. 

The rhythm is dictated by an 8px base unit. Generous white space (using `lg` and `xl` tokens) is applied between major content blocks to prevent cognitive overload. Margins are kept wide (24px on mobile) to ensure the interface feels "airy" despite the dark color palette. Focus-mode views should center content and increase side margins to 15% of the viewport width to draw the eyes inward.

## Elevation & Depth

Depth in this design system is achieved through **Tonal Layering** and **Low-Contrast Outlines** rather than heavy drop shadows.

1.  **Level 0 (Base):** #0F1115.
2.  **Level 1 (Cards/Sidebar):** #1C1F26 with a 1px solid border at 10% white opacity.
3.  **Level 2 (Modals/Overlays):** Semi-transparent glass (12% opacity) with a 20px backdrop blur and a subtle 0.5px "inner glow" border.
4.  **Shadows:** When necessary, use extremely diffused shadows (#000000 at 40% opacity, 30px blur, 10px spread) to lift active modals.

Interactive elements use a subtle inner-shadow when "pressed" to create a tactile, physical response.

## Shapes

The shape language is consistently **Rounded**. 

The base radius (0.5rem) is applied to standard buttons and input fields. Larger containers, such as study cards or video players, utilize the `rounded-xl` (1.5rem) token to soften the overall appearance of the professional dark theme. Circular shapes are reserved strictly for status indicators and profile avatars. Icons should feature a consistent 2px stroke weight with rounded caps and joins to match the UI's geometry.

## Components

### Buttons
- **Primary:** Gradient background (#007AFF to #5E5CE6), white text, soft 0.5rem corners.
- **Secondary:** Glassmorphic background (White 10% + Blur), 1px border.
- **Icon Buttons:** Circular or soft-square backgrounds with 20% opacity of the icon color.

### Player Controls
The playback bar should be a thin 4px track with a high-contrast #007AFF progress fill. The "scrubber" should only appear on hover/touch to minimize distraction.

### Chips & Tags
Used for categories or difficulty levels. Use a "Slate" fill (#2C2E33) with `label-sm` typography. Active states should use a subtle blue glow effect.

### Input Fields
Deep charcoal fill, 1px slate border. On focus, the border transitions to Primary Blue with a 4px soft outer glow (bloom).

### Cards
Study cards should have a subtle 1px border. Content inside cards should follow the generous spacing rules, with at least 24px of internal padding.