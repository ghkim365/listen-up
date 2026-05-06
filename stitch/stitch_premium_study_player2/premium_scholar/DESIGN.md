---
name: Premium Scholar
colors:
  surface: '#121317'
  surface-dim: '#121317'
  surface-bright: '#38393d'
  surface-container-lowest: '#0d0e11'
  surface-container-low: '#1a1b1f'
  surface-container: '#1e1f23'
  surface-container-high: '#292a2d'
  surface-container-highest: '#343538'
  on-surface: '#e3e2e7'
  on-surface-variant: '#c4c6d0'
  inverse-surface: '#e3e2e7'
  inverse-on-surface: '#2f3034'
  outline: '#8e909a'
  outline-variant: '#44474f'
  surface-tint: '#adc6ff'
  primary: '#d8e2ff'
  on-primary: '#122f5f'
  primary-container: '#adc6ff'
  on-primary-container: '#385283'
  inverse-primary: '#455e90'
  secondary: '#ffb4aa'
  on-secondary: '#690003'
  secondary-container: '#c5020b'
  on-secondary-container: '#ffd2cc'
  tertiary: '#ffdea4'
  on-tertiary: '#412d00'
  tertiary-container: '#ebc06e'
  on-tertiary-container: '#6c4d01'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#d8e2ff'
  primary-fixed-dim: '#adc6ff'
  on-primary-fixed: '#001a42'
  on-primary-fixed-variant: '#2c4677'
  secondary-fixed: '#ffdad5'
  secondary-fixed-dim: '#ffb4aa'
  on-secondary-fixed: '#410001'
  on-secondary-fixed-variant: '#930005'
  tertiary-fixed: '#ffdea5'
  tertiary-fixed-dim: '#ebc06e'
  on-tertiary-fixed: '#261900'
  on-tertiary-fixed-variant: '#5d4200'
  background: '#121317'
  on-background: '#e3e2e7'
  surface-variant: '#343538'
typography:
  display:
    fontFamily: Inter
    fontSize: 48px
    fontWeight: '700'
    lineHeight: '1.1'
    letterSpacing: -0.02em
  h1:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '600'
    lineHeight: '1.2'
    letterSpacing: -0.01em
  h2:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: '1.3'
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.6'
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.6'
  body-sm:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: '1.5'
  label-caps:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: '1'
    letterSpacing: 0.05em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  unit: 4px
  xs: 0.5rem
  sm: 1rem
  md: 1.5rem
  lg: 2.5rem
  xl: 4rem
  mobile_frame_width: 390px
  max_content_width: 1200px
---

## Brand & Style

This design system is engineered for deep intellectual engagement, catering to researchers, academics, and high-performance learners. The brand personality is authoritative yet unobtrusive, prioritizing cognitive ease and focus over visual noise. 

The design style combines **Minimalism** with **Glassmorphism**. By utilizing a refined "Deep Focus" dark mode, the interface recedes to let content take center stage. Subtle translucent layers and backdrop blurs provide a sense of architectural depth without breaking the user's concentration, creating a digital environment that feels like a quiet, high-end library.

## Colors

The palette is anchored in deep charcoal tones to reduce eye strain during long sessions. 
- **Base Background (#16181D):** The foundation of the UI, providing a sophisticated, slightly lifted dark mode.
- **Surface Tiers:** Functional elevation is achieved through #23262B (cards/containers) and #2D3037 (modals/tooltips).
- **Accents:** Scholar Blue (#ADC6FF) is used for primary actions and focus states, while Premium Red (#FF3B30) is reserved for critical alerts and destructive actions.
- **Glassmorphism:** Overlays utilize a white or primary-tinted fill at 12-15% opacity with a 16px to 24px backdrop blur.

## Typography

The design system exclusively utilizes **Inter** to maintain a systematic, utilitarian aesthetic that excels in legibility. 
- **Hierarchy:** Strong weight differentiation distinguishes headers from body text. 
- **Body Text:** Uses Slate-300 (#CBD5E1) for primary reading and Slate-400 (#94A3B8) for secondary descriptions to ensure high readability against the charcoal backgrounds.
- **Rhythm:** Generous line-heights (1.6x) are applied to long-form text blocks to support sustained reading.

## Layout & Spacing

This system employs a **Hybrid Responsive Model**. 
- **PC Layout:** A centered, fixed-grid system with a max-width of 1200px.
- **Mobile-in-PC View:** To maintain a "Focus Mode," users can toggle a centered mobile frame (390px wide) even on desktop. The area outside this frame should be the base background color (#16181D) to minimize peripheral distractions.
- **Grit:** A base 4px unit governs all spacing, ensuring consistent vertical rhythm across containers and components.

## Elevation & Depth

Depth is communicated through **Tonal Layering** and **Glassmorphism** rather than traditional heavy shadows.
- **Layer 0:** Base Background (#16181D).
- **Layer 1:** Cards and primary containers (#23262B) with a subtle 1px border (#334155 at 20% opacity).
- **Layer 2:** Popovers and floating navigation (#2D3037).
- **Glass Effects:** Use a `backdrop-filter: blur(20px)` on Layer 2 elements when they overlap content, paired with a 12% opacity white border to define the edge. Shadows, if used, should be extremely diffused (30px+ blur) and use the base background color at 50% opacity.

## Shapes

The shape language is **Soft** and precise. 
- **Standard Radius:** 0.25rem (4px) for small elements like checkboxes and tags.
- **Container Radius:** 0.5rem (8px) for cards and main UI blocks.
- **Large Radius:** 0.75rem (12px) for modals and primary section wrappers.
This subtle rounding maintains a professional, "engineered" feel while avoiding the clinical sharpness of 0px corners.

## Components

- **Buttons:** Primary buttons use Scholar Blue (#ADC6FF) with dark text. Ghost buttons use a 1px border of Slate-700 and transition to a 12% white overlay on hover.
- **Cards:** Background #23262B. Ensure padding is generous (at least 24px) to emphasize the "Deep Focus" intent.
- **Input Fields:** Use the #16181D background with a 1px border (#334155). On focus, the border shifts to Scholar Blue with a subtle outer glow.
- **Glass Overlays:** Used for top navigation bars and sidebars. Apply a 15% opacity tint of the surface color and a heavy blur.
- **Hybrid Toggle:** A specialized component in the utility bar that allows the user to switch between "Wide Layout" and "Centered Focus" (the mobile view within the PC frame).
- **Progress Indicators:** Use thin 2px lines in Scholar Blue to indicate reading or task progress without cluttering the viewport.