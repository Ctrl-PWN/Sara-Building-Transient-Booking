# Block Center — Design System

## Brand & Style

The design system for this property management platform employs a **Brutalist-Lite** aesthetic that prioritizes structural integrity and spatial clarity. By blending the raw, honest layout principles of brutalism with a warm, tactile color palette, the interface evokes a sense of physical architecture and reliable management.

The personality is **grounded, authoritative, yet approachable**. It rejects the ethereal nature of modern SaaS design in favor of "physical" UI — elements feel like heavy blocks or architectural tiles. High contrast and generous spacing ensure that users can navigate complex property data through instant pattern recognition rather than dense text parsing.

## Colors

The palette is inspired by natural building materials — terracotta, sand, and sage — providing a "human" touch to the industrial layout.

- **Primary (Terracotta):** Used for "Occupied" states and primary actions. It signifies life and activity within a space.
- **Status Colors:** Functional clarity is achieved through Sage (Available), Saffron (Reserved), and Sunset Orange (Maintenance/Alert).
- **Core Neutral:** Deep Charcoal (`#2C3531`) is the exclusive color for all borders and primary text, providing the "ink" that binds the structural blocks together.
- **Surface Strategy:** Backgrounds use a warm Sand to reduce eye strain, while active UI containers use Pure White to "pop" against the 2px charcoal borders.

### Token reference

```yaml
colors:
  surface: '#f2fcf5'
  surface-dim: '#d3dcd6'
  surface-bright: '#f2fcf5'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#ecf6f0'
  surface-container: '#e6f0ea'
  surface-container-high: '#e1eae4'
  surface-container-highest: '#dbe5df'
  on-surface: '#151d1a'
  on-surface-variant: '#56423e'
  inverse-surface: '#29322e'
  inverse-on-surface: '#e9f3ed'
  outline: '#8a726d'
  outline-variant: '#ddc0bb'
  surface-tint: '#a23e2e'
  primary: '#9e3b2c'
  on-primary: '#ffffff'
  primary-container: '#bf5342'
  on-primary-container: '#fffbff'
  inverse-primary: '#ffb4a7'
  secondary: '#4e6358'
  on-secondary: '#ffffff'
  secondary-container: '#cee5d8'
  on-secondary-container: '#52675d'
  tertiary: '#745b00'
  on-tertiary: '#ffffff'
  tertiary-container: '#c9a845'
  on-tertiary-container: '#4f3d00'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#ffdad4'
  primary-fixed-dim: '#ffb4a7'
  on-primary-fixed: '#400200'
  on-primary-fixed-variant: '#822719'
  secondary-fixed: '#d1e8da'
  secondary-fixed-dim: '#b5ccbf'
  on-secondary-fixed: '#0b1f17'
  on-secondary-fixed-variant: '#374b41'
  tertiary-fixed: '#ffe08b'
  tertiary-fixed-dim: '#e6c35d'
  on-tertiary-fixed: '#241a00'
  on-tertiary-fixed-variant: '#584400'
  background: '#f2fcf5'
  on-background: '#151d1a'
  surface-variant: '#dbe5df'
```

## Typography

The typographic hierarchy utilizes three distinct voices to separate intent:

1. **Fraunces (The Narrative):** A soft-serif used for headings and property names. It adds a premium, editorial feel that balances the harshness of the brutalist lines.
2. **Outfit (The Interface):** A clean, modern sans-serif for body copy, descriptions, and general navigation. Its high x-height ensures readability against the warm background.
3. **Space Grotesk (The Ledger):** A technical, geometric typeface used for all numerical data, financials, and unit numbers. Its monospaced-adjacent feel suggests precision and accuracy in reporting.

### Type scale

| Token | Font | Size | Weight | Line Height | Letter Spacing |
|-------|------|------|--------|-------------|----------------|
| `display-lg` | Fraunces | 48px | 700 | 1.1 | -0.02em |
| `headline-lg` | Fraunces | 32px | 600 | 1.2 | — |
| `headline-lg-mobile` | Fraunces | 24px | 600 | 1.2 | — |
| `headline-md` | Fraunces | 24px | 600 | 1.3 | — |
| `body-lg` | Outfit | 18px | 400 | 1.6 | — |
| `body-md` | Outfit | 16px | 400 | 1.5 | — |
| `data-lg` | Space Grotesk | 20px | 500 | 1.2 | -0.01em |
| `data-md` | Space Grotesk | 14px | 500 | 1.2 | — |
| `label-caps` | Space Grotesk | 12px | 700 | 1 | 0.05em |

## Layout & Spacing

The layout is governed by a **Fixed Grid** philosophy that treats the screen as a construction site. Elements are placed into clearly defined "lots."

- **The Grid:** A 12-column grid on desktop with a fixed 16px gutter.
- **The Border Rule:** Every major container and interactive element must be bounded by a **2px solid Deep Charcoal (`#2C3531`)** border. Do not use hair-lines or subtle dividers.
- **Rhythm:** Use an 8px base unit. Spatial recognition is prioritized over density; never crowd the interface. If a container feels full, increase the margin rather than shrinking the text.
- **Responsive:** On mobile, columns collapse to a single stack, but the 24px container padding is maintained to ensure the "block" edges are always visible against the Sand background.

### Spacing tokens

| Token | Value |
|-------|-------|
| `spacing-unit` | 8px |
| `container-padding` | 24px |
| `gutter` | 16px |
| `margin-sm` | 16px |
| `margin-md` | 32px |
| `margin-lg` | 64px |

### Radius tokens

| Token | Value |
|-------|-------|
| `sm` | 0.25rem |
| `DEFAULT` | 0.5rem |
| `md` | 0.75rem |
| `lg` | 1rem |
| `xl` | 1.5rem |
| `full` | 9999px |

## Elevation & Depth

This design system rejects all shadows, gradients, and blurs. Depth is achieved strictly through **Tonal Stacking and Offset Borders**:

1. **Flat Stacking:** All elements sit on the same Z-axis. Separation is achieved by the 2px Deep Charcoal borders.
2. **Active States:** When a button or card is "pressed," it does not sink or glow. Instead, it may change its fill color to the Primary (Terracotta) or invert its colors (Charcoal background with White text).
3. **Layering:** If a modal or popover is required, it is treated as a solid block placed on top of the layout, still using the 2px border to define its boundaries. No backdrop blur is used; use a solid 20% opacity Charcoal overlay if necessary.

## Shapes

A uniform **16px (1rem)** border radius is applied to all primary containers, buttons, and input fields. This softened corner prevents the brutalist 2px borders from feeling too aggressive or "sharp," reinforcing the warm and tactile nature of the brand.

Small elements like tags or "Unit ID" labels may use the same 16px radius, effectively making them pill-shaped if they are small enough, maintaining a consistent curvature language across the system.

## Components

- **Buttons:** 2px Charcoal border, 16px radius. Primary buttons use a Terracotta fill with White text. Secondary buttons use a White fill with Charcoal text. Use Space Grotesk for button labels.
- **Cards (The "Property Block"):** White background, 2px Charcoal border. The header of the card should be separated by a 2px horizontal line. Use Fraunces for the title and Space Grotesk for the unit availability.
- **Input Fields:** White background, 2px Charcoal border. When focused, the border remains 2px Charcoal, but the background shifts to a very light tint of the primary color (Terracotta at 5% opacity).
- **Status Chips:** Small blocks with a 2px border. The fill color indicates the status (Sage, Saffron, etc.). Use Space Grotesk Bold at 12px for the text.
- **Financial Tables:** No cell borders; only a single 2px bottom border for the header row and a 2px border around the entire table container. Use Space Grotesk for all numerical entries to ensure alignment.
- **Navigation:** Vertical sidebar using large blocks. Active links are filled with Terracotta and White text; inactive links remain White with Charcoal text and borders.
