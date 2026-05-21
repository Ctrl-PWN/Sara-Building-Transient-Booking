---
name: Architectural Serenity - Night
colors:
  surface: '#161615' # Oiled Charcoal (Base canvas)
  surface-dim: '#0f0f0e' # Deep Slate
  surface-bright: '#222120' # Polished Basalt
  surface-container-lowest: '#0a0a0a'
  surface-container-low: '#1c1b1a'
  surface-container: '#222120' # Standard Card Background
  surface-container-high: '#2d2c2a' # Elevated Layer
  surface-container-highest: '#383735'
  on-surface: '#e6e2de' # Parchment White (High contrast text)
  on-surface-variant: '#cac6bd' # Muted Stone (Secondary text)
  inverse-surface: '#faf9f7'
  inverse-on-surface: '#1a1c1b'
  outline: '#53524b' # Raw Steel (Drafted borders)
  outline-variant: '#3c3b36'
  surface-tint: '#cac6bf'
  primary: '#e6e2de' # Parchment White (Primary structural actions)
  on-primary: '#161615' # Dark text on light button
  primary-container: '#383735'
  on-primary-container: '#e6e2de'
  inverse-primary: '#181816'
  secondary: '#dbc3a6' # Luminous Bronze (Active states/Accents)
  on-secondary: '#3a2b1a'
  secondary-container: '#55442e' # Amber Glow Container
  on-secondary-container: '#f8dec1'
  tertiary: '#cac6bf' # Warm Gray Accent
  on-tertiary: '#161615'
  tertiary-container: '#2d2c28'
  on-tertiary-container: '#cac6bf'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  background: '#161615'
  on-background: '#e6e2de'
  surface-variant: '#2d2c2a'
---

a

## Brand & Style

This design system is built upon the principles of modern architectural practice: structural integrity, intentionality, and a balance between raw materiality and refined comfort. It targets an audience that appreciates precision and timelessness, such as design professionals, developers, and high-end service providers.

The visual style is **Architectural Minimalism**. It emphasizes heavy whitespace to allow content to breathe, utilizing a sophisticated interplay of serif and sans-serif typography to evoke a "studio" atmosphere. The emotional response should be one of calm authority and intellectual warmth—avoiding the coldness of traditional tech minimalism in favor of a "lived-in" professional aesthetic.

## Colors

The palette is derived from natural architectural materials: limestone, blackened steel, and oak.

- **Primary (#2D2C2A):** A "Carbon Black" used for high-contrast typography and structural elements.
- **Secondary (#A69076):** A "Muted Bronze" used for accents, active states, and call-to-actions, providing a warm focal point.
- **Tertiary (#E5E1DA):** A "Warm Stone" used for subtle borders and secondary containers.
- **Neutral (#F9F8F6):** A "Parchment White" background that reduces eye strain and provides a softer canvas than pure white.

Usage is strictly disciplined: use the neutral background for the majority of the UI, with primary tones reserved for the most critical information hierarchy.

## Typography

The typographic strategy relies on a "Dual-Tone" hierarchy. **Newsreader** provides a sophisticated, editorial, and authoritative feel for all headings, mimicking the masthead of a high-end architectural journal. It should be used with tighter tracking in larger sizes to maintain visual density.

**Inter** handles all functional and body text. Its neutral, utilitarian character ensures maximum legibility for data, interface labels, and long-form descriptions. Use uppercase for labels to create a clear distinction between "Interface" (Inter) and "Content" (Newsreader).

## Layout & Spacing

The layout is governed by a **Fixed Grid** system that centers the content on large displays, creating a "gallery" effect.

- **Desktop:** A 12-column grid with 24px gutters and 64px outer margins. Elements should align strictly to column edges to reinforce the architectural feel.
- **Mobile:** A 4-column fluid grid with 16px gutters and 20px margins.
- **Rhythm:** All vertical spacing must be a multiple of the 8px base unit. Section-level padding should be generous (80px or 96px) to signify a change in context without the need for heavy dividers.

## Elevation & Depth

This design system avoids high-elevation shadows to maintain a grounded, structural appearance.

- **Tonal Layers:** Depth is primarily communicated through subtle shifts in background color (e.g., a "Warm Stone" card on a "Parchment White" background).
- **Ambient Shadows:** When physical separation is required (like in dropdowns or modals), use an extremely diffused, low-opacity shadow with a hint of the secondary color tint: `0px 10px 30px rgba(45, 44, 42, 0.05)`.
- **Ghost Borders:** Use 1px solid strokes in the Tertiary color for defining input fields and containers, ensuring the UI feels drafted rather than rendered.

## Shapes

The shape language is defined by the **Rounded-Eight** rule. A base radius of 0.5rem (8px) is applied to all standard components like buttons, input fields, and small cards.

Larger containers (like hero images or main content areas) should scale to 1rem (16px) or 1.5rem (24px) to maintain visual harmony. This moderate roundness softens the industrial grid, making the professional environment feel accessible and tactile.

## Components

- **Buttons:** Primary buttons use a solid Carbon Black background with white Inter text (Medium weight). Secondary buttons use a Ghost style with a 1px Stone border.
- **Cards:** Cards should have no shadow by default, instead using a "Warm Stone" background or a thin 1px border. Headlines within cards use Newsreader MD.
- **Input Fields:** Fields use a 1px border. On focus, the border transitions to the Secondary color (Bronze) with a subtle 2px inset glow. Labels are Inter (Label-MD) placed strictly above the field.
- **Chips:** Small, 8px rounded elements used for categories. Use the Tertiary background with Carbon Black text.
- **Lists:** Use generous 16px vertical padding between items, separated by a 1px Tertiary divider that does not span the full width of the container.
- **Additional Components:** "Blueprint Icons" (thin stroke icons, 1.5px weight) should be used sparingly to guide navigation without cluttering the architectural clarity of the typography.
