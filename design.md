---
version: alpha
name: Saas-magicui
description: |
  Acme.ai presents a clean, minimalist design system emphasizing clarity and
  productivity. The visual language is contemporary and tech-forward, with a
  reliance on neutral foundations and strategic accent deployment to guide user
  attention. Large, bold typography anchors hero sections and communicates
  hierarchy with confidence. The interface employs generous whitespace and light
  touch shadows for visual breathing room, avoiding heavy depth treatments.
  Color blocking through pure neutrals—white surfaces and black text—is the
  primary organizational strategy, with vibrant accent colors reserved for
  critical calls-to-action and interactive states. This approach conveys
  professionalism while remaining approachable, balancing technical
  sophistication with user accessibility.
source:
  url: "https://saas-magicui.vercel.app/"
  pagesAnalyzed: 1
  extractedAt: 2026-09-30
  tokensMeasured: true
colors:
  neutral-1: "#FFFFFF"
  neutral-2: "#000000"
typography:
  display-lg:
    fontFamily: Inter
    fontSize: 60px
    fontWeight: 500
    lineHeight: 1.25
    letterSpacing: 0px
  display-lg-strong:
    fontFamily: Inter
    fontSize: 60px
    fontWeight: 600
    lineHeight: 1.25
    letterSpacing: 0px
  display-md:
    fontFamily: Inter
    fontSize: 48px
    fontWeight: 600
    lineHeight: 1
    letterSpacing: 0px
  display-md-strong:
    fontFamily: Inter
    fontSize: 48px
    fontWeight: 700
    lineHeight: 1
    letterSpacing: -1.2px
  heading-md:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: 600
    lineHeight: 1.4
    letterSpacing: 0px
  heading-sm:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: 600
    lineHeight: 1.5
    letterSpacing: 0px
  heading-xs:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: 500
    lineHeight: 1.43
    letterSpacing: -0.35px
  heading-xs-strong:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: 600
    lineHeight: 1.43
    letterSpacing: 0px
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: 400
    lineHeight: 1.78
    letterSpacing: 0px
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: 0px
  body-md-strong:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: 500
    lineHeight: 1.5
    letterSpacing: 0px
  body-sm:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: 400
    lineHeight: 1.43
    letterSpacing: 0px
  body-sm-strong:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: 700
    lineHeight: 1.43
    letterSpacing: 0px
  body-xs:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: 400
    lineHeight: 1.33
    letterSpacing: 0px
  button-xl:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: 700
    lineHeight: 1.4
    letterSpacing: 0px
  button-lg:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: 500
    lineHeight: 1.43
    letterSpacing: 0px
  caption-xs:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: 400
    lineHeight: 1.67
    letterSpacing: 0px
  caption-xs-arial:
    fontFamily: Arial
    fontSize: 12px
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: 0px
  code:
    fontFamily: ui-monospace
    fontSize: 14px
    fontWeight: 500
    lineHeight: 1.43
    letterSpacing: 0.7px
    textTransform: uppercase
rounded:
  none: 0px
  xs: 8px
  sm: 14px
  full: 9999px
spacing:
  xxs: 4px
  xs: 8px
  sm: 12px
  md: 16px
  lg: 20px
  xl: 24px
  xxl: 32px
  xxxl: 40px
  section: 48px
  band: 52px
borderWidths:
  thin: 1px
shadows:
  sm: "rgba(0, 0, 0, 0.05) 0px 1px 2px 0px"
  md: "rgba(0, 0, 0, 0.1) 0px 10px 15px -3px, rgba(0, 0, 0, 0.1) 0px 4px 6px -4px"
  lg: "rgba(0, 0, 0, 0.1) 0px 4px 6px -1px, rgba(0, 0, 0, 0.1) 0px 2px 4px -2px"
elevationStrategy: layered-micro
themes:
  derived: dark
  light:
    bg: "#FFFFFF"
    surface: "#F7F7F7"
    surfaceRaised: "#EEEEEE"
    text: "#111111"
    textMuted: "#646464"
    border: "#E2E2E2"
    accent: "#111111"
    accentFg: "#FFFFFF"
    focusRing: "#111111"
    elevation: shadow
  dark:
    bg: "#0F0F10"
    surface: "#1D1D1E"
    surfaceRaised: "#29292A"
    text: "#F5F5F5"
    textMuted: "#9E9E9E"
    border: "#353536"
    accent: "#818181"
    accentFg: "#0B0B0C"
    focusRing: "#636363"
    elevation: "border+surface"
gradients:
  - context: section
    kind: linear
    value: "linear-gradient(to top, oklch(0.985 0 0) 0px, rgba(0, 0, 0, 0) 100%)"
  - context: section
    kind: linear
    value: "linear-gradient(to right, oklch(1 0 0) 0px, rgba(0, 0, 0, 0) 100%)"
  - context: section
    kind: linear
    value: "linear-gradient(to left, oklch(1 0 0) 0px, rgba(0, 0, 0, 0) 100%)"
  - context: section
    kind: linear
    value: "linear-gradient(to top, oklch(1 0 0) 0px, oklch(1 0 0) 50%, rgba(0, 0, 0, 0) 100%)"
components:
  button-filled:
    textColor: "{colors.neutral-2}"
    border: "1px solid oklch(0.922 0 0)"
    height: 36px
    padding: "8px 16px 8px 16px"
    fontSize: 18px
    boxShadow: "rgba(0, 0, 0, 0.05) 0px 1px 2px 0px"
    fontFamily: Inter
    fontWeight: 600
    lineHeight: 1.56
    rounded: "{rounded.xs}"
    backgroundColor: "{colors.neutral-1}"
  button-outline:
    textColor: "{colors.neutral-1}"
    border: "1px solid oklch(0.922 0 0)"
    height: 36px
    padding: "8px 16px 8px 16px"
    fontSize: 18px
    boxShadow: "rgba(0, 0, 0, 0.05) 0px 1px 2px 0px"
    fontFamily: Inter
    fontWeight: 600
    lineHeight: 1.56
    rounded: "{rounded.xs}"
    backgroundColor: "oklch(0.577 0.245 27.325)"
  button-text:
    typography: "{typography.body-md}"
    textColor: "oklch(0.145 0 0)"
    height: 32px
    padding: "4px 8px 4px 8px"
    boxShadow: "oklch(0.97 0 0) 0px 0px 0px 1px"
    rounded: "3.35544e+07px"
    backgroundColor: "oklab(0.577 0.217662 0.112464 / 0.2)"
  button-text-lg:
    typography: "{typography.heading-xs}"
    textColor: "oklch(1 0 0)"
    height: 36px
    padding: "8px 12px 8px 12px"
    boxShadow: "rgba(0, 0, 0, 0.05) 0px 1px 2px 0px"
    rounded: "{rounded.xs}"
    backgroundColor: "oklch(0.577 0.245 27.325)"
  button-outline-2:
    typography: "{typography.heading-xs}"
    textColor: "oklch(0.145 0 0)"
    border: "1px solid oklch(0.922 0 0)"
    height: 36px
    padding: "8px 16px 8px 16px"
    boxShadow: "rgba(0, 0, 0, 0.05) 0px 1px 2px 0px"
    rounded: "{rounded.xs}"
    backgroundColor: "oklch(1 0 0)"
  card:
    typography: "{typography.body-md}"
    textColor: "oklch(0.145 0 0)"
    padding: "24px 0px 24px 0px"
    rounded: "{rounded.sm}"
    backgroundColor: "oklch(1 0 0)"
  navigation:
    typography: "{typography.body-md}"
    textColor: "oklch(0.145 0 0)"
    height: 36px
  footer:
    typography: "{typography.body-md}"
    textColor: "oklch(0.145 0 0)"
  link:
    typography: "{typography.heading-xs}"
    textColor: "oklch(0.145 0 0)"
    padding: "8px 16px 8px 16px"
    rounded: 6px
  link-sm:
    typography: "{typography.body-md}"
    textColor: "oklch(0.556 0 0)"
states:
  other-hover:
    target: other
    state: hover
    opacity: 1
  other-disabled:
    target: other
    state: disabled
    opacity: 0.5
  other-focus-visible:
    target: other
    state: focus-visible
    outlineWidth: 1px
breakpoints:
  - width: 375
    containerWidth: 311
    gridColumns: 4
    navLinksVisible: 0
    menuToggleVisible: true
    headingPx: 36
    bodyPx: 16
    sectionPaddingX: 0
  - width: 768
    containerWidth: 704
    gridColumns: 4
    navLinksVisible: 0
    menuToggleVisible: true
    headingPx: 60
    bodyPx: 16
    sectionPaddingX: 0
  - width: 1024
    containerWidth: 960
    gridColumns: 4
    navLinksVisible: 1
    menuToggleVisible: true
    headingPx: 60
    bodyPx: 16
    sectionPaddingX: 0
  - width: 1280
    containerWidth: 1216
    gridColumns: 4
    navLinksVisible: 1
    menuToggleVisible: true
    headingPx: 60
    bodyPx: 16
    sectionPaddingX: 0
  - width: 1440
    containerWidth: 1400
    gridColumns: 4
    navLinksVisible: 1
    menuToggleVisible: true
    headingPx: 60
    bodyPx: 16
    sectionPaddingX: 0
coverage:
  statesFound: 34
  gradientsFound: 4
  rolesUnassigned: 2
  archetypesUnnamed: 0
  archetypesDetected: 0
  responsiveMeasured: true
  stylesheetsBlocked: true
  semanticRampDeclared: false
---

# Design System Inspired by Acme.ai

## 1. Visual Theme & Atmosphere

Acme.ai presents a clean, minimalist design system emphasizing clarity and productivity. The visual language is contemporary and tech-forward, with a reliance on neutral foundations and strategic accent deployment to guide user attention. Large, bold typography anchors hero sections and communicates hierarchy with confidence. The interface employs generous whitespace and light touch shadows for visual breathing room, avoiding heavy depth treatments. Color blocking through pure neutrals—white surfaces and black text—is the primary organizational strategy, with vibrant accent colors reserved for critical calls-to-action and interactive states. This approach conveys professionalism while remaining approachable, balancing technical sophistication with user accessibility.

**Key Characteristics:**
- Minimalist, high-contrast layout with white/black as primary neutrals
- Sharp and smooth border radius applied selectively per component role
- Micro-scale shadows (barely-perceptible opacity layers) for subtle elevation
- Bold, large display typography with aggressive negative letter-spacing on larger sizes
- Red accent color (`#FB2C36` equivalent) for primary CTAs and brand emphasis
- Flat design with color-blocking as primary depth strategy
- Generous whitespace and systematic spacing scale supporting visual hierarchy
- Multi-tier z-index stacking for dropdowns and overlays without layered shadow effects

## 2. Color Palette & Roles

### Primary
- **Accent / Brand** (`#FB2C36`): Primary call-to-action buttons, hero CTAs, and brand emphasis; used in filled button variants and key interactive elements driving conversion.

### Neutral Scale
- **Canvas / Background** (`{colors.neutral-1}` — `#FFFFFF`): Main page background, card surfaces, and default container fills for content presentation.
- **Text / Foreground** (`{colors.neutral-2}` — `#000000`): Primary text color for body copy, headings, and standard content; highest contrast against white surfaces.

### Semantic / Status
No semantic color ramp (error, success, warning, info) is declared in the site's markup. Interactive states reference CSS custom properties (e.g., `--primary`, `--accent`, `--destructive`, `--secondary`) that are not explicitly measured or defined in the extracted tokens. See Known Gaps.

## 3. Typography Rules

### Font Family
**Primary:** Inter, ui-sans-serif, system sans-serif  
**Code:** ui-monospace, Menlo, Monaco, monospace  
**Fallback (low-confidence):** Arial, sans-serif

### Hierarchy

| Role | Font | Size | Weight | Line Height | Letter Spacing | Notes |
|---|---|---|---|---|---|---|
| Display XL | Inter | 60px | 500 | 1.25 | 0px | Large hero headlines |
| Display XL Strong | Inter | 60px | 600 | 1.25 | 0px | Emphasized hero text |
| Display MD | Inter | 48px | 600 | 1 | 0px | Major section headings |
| Display MD Strong | Inter | 48px | 700 | 1 | -1.2px | Bold display with tight tracking |
| Heading MD | Inter | 20px | 600 | 1.4 | 0px | Subsection headings |
| Heading SM | Inter | 16px | 600 | 1.5 | 0px | Small section titles |
| Heading XS | Inter | 14px | 500 | 1.43 | -0.35px | Compact headings with tracking |
| Heading XS Strong | Inter | 14px | 600 | 1.43 | 0px | Emphasized compact headings |
| Body LG | Inter | 18px | 400 | 1.78 | 0px | Large body text |
| Body MD | Inter | 16px | 400 | 1.5 | 0px | Standard body copy |
| Body MD Strong | Inter | 16px | 500 | 1.5 | 0px | Emphasized body text |
| Body SM | Inter | 14px | 400 | 1.43 | 0px or -0.35px | Small body copy |
| Body SM Strong | Inter | 14px | 700 | 1.43 | 0px | Bold small body text |
| Body XS | Inter | 12px | 400 | 1.33 | 0px | Extra-small body text |
| Button XL | Inter | 20px | 700 | 1.4 | 0px | Large button labels |
| Button LG | Inter | 14px | 500 | 1.43 | 0px | Standard button text |
| Caption XS | Inter | 12px | 400 | 1.67 | 0px | Small captions and metadata |
| Caption XS Arial | Arial | 12px | 400 | 1.5 | 0px | Fallback caption style |
| Code | ui-monospace | 14px | 500 | 1.43 | 0.7px | Monospace code with uppercase transform |

### Principles
- **Micro-scale tracking:** Display sizes employ aggressive negative letter-spacing (-1.2px on Display MD Strong, -0.35px on compact headings) to tighten perceived line-length and increase visual impact.
- **Weight contrast:** Body text defaults to 400; headings and buttons use 500–700 weights to create clear hierarchy without size increases alone.
- **Line-height logic:** Display text (line-height 1.0–1.25) is tight for impact; body and buttons relax to 1.4–1.78 for readability and spacing breathing room.
- **Inter as system default:** All text except code and fallback captions use Inter's clean, modern curves; monofonts reserved for technical content only.

## 4. Component Stylings

### Buttons

#### Primary / Filled Button
- **Background:** `#FB2C36` (red accent)
- **Text Color:** `#FFFFFF` (white)
- **Padding:** `8px 16px`
- **Height:** 36px
- **Font:** `{typography.button-lg}` (14px, weight 500)
- **Border:** 1px solid (`#EBEBEB` — light neutral border)
- **Border Radius:** `{rounded.xs}` (8px)
- **Box Shadow:** `rgba(0, 0, 0, 0.05) 0px 1px 2px 0px` (micro-lift)
- **Hover State:** Opacity 0.9 or reduced red saturation
- **Line Height:** 1.43

#### Secondary / Outline Button
- **Background:** `#FB2C36` (red accent, outline variant)
- **Text Color:** `#FFFFFF` (white)
- **Padding:** `8px 16px`
- **Height:** 36px
- **Font:** `{typography.button-lg}` (14px, weight 500)
- **Border:** 1px solid (`#EBEBEB`)
- **Border Radius:** `{rounded.xs}` (8px)
- **Box Shadow:** `rgba(0, 0, 0, 0.05) 0px 1px 2px 0px`
- **Hover State:** Background lightens via `color-mix(in oklab, var(--primary) 10%, transparent)`

#### Ghost / Text Button
- **Background:** Transparent or light tint (`oklab(0.577 0.217662 0.112464 / 0.2)`)
- **Text Color:** `#000000` (black)
- **Padding:** `4px 8px`
- **Height:** 32px
- **Font:** `{typography.body-md}` (16px, weight 400)
- **Border:** None (0px)
- **Border Radius:** `{rounded.full}` (9999px — pill-shaped)
- **Box Shadow:** `oklch(0.97 0 0) 0px 0px 0px 1px` (thin outline on shadow layer)
- **Hover State:** Background opacity increases; text color remains dark

#### Button Text LG
- **Background:** `#FB2C36` (red accent)
- **Text Color:** `#FFFFFF` (white)
- **Padding:** `8px 12px`
- **Height:** 36px
- **Font:** `{typography.button-lg}` (14px, weight 500)
- **Border:** None (0px)
- **Border Radius:** `{rounded.xs}` (8px)
- **Box Shadow:** `rgba(0, 0, 0, 0.05) 0px 1px 2px 0px`

### Cards & Containers

#### Card Default
- **Background:** `#FFFFFF` (white)
- **Text Color:** `#000000` (black)
- **Padding:** `24px 0px` (vertical only)
- **Border:** None (0px)
- **Border Radius:** `{rounded.sm}` (14px)
- **Box Shadow:** None (`rgba(0, 0, 0, 0)` layer)
- **Font:** `{typography.body-md}` (16px, weight 400)
- **Height:** 300px (measured context-dependent; adjust as needed)

### Inputs & Forms

#### Input Field
- **Background:** Defaults to white; hover triggers `{input}` color or `color-mix(in oklab, var(--input) 50%, transparent)`
- **Border:** 1px solid light gray (`oklch(0.922 0 0)`)
- **Border Radius:** `{rounded.xs}` (8px)
- **Text Color:** `#000000`
- **Font:** `{typography.body-md}` (16px, weight 400)
- **Padding:** `8px 16px`
- **Hover State:** Background shifts per `color-mix` calculation; shadow remains minimal

### Navigation

#### Nav Link
- **Background:** Transparent
- **Text Color:** `#000000`
- **Padding:** `0px` (no internal padding; link spacing handled by layout)
- **Font:** `{typography.body-md}` (16px, weight 400)
- **Border:** None (0px)
- **Border Radius:** `{rounded.none}` (0px)
- **Box Shadow:** None
- **Height:** 36px (container only)
- **Hover State:** Background highlights via `var(--accent)` or `color-mix` variant

#### Footer
- **Background:** Transparent / inherit
- **Text Color:** `#000000`
- **Font:** `{typography.body-md}` (16px, weight 400)
- **Border:** None
- **Border Radius:** 0px
- **Padding:** 0px (layout-dependent)

### Links

#### Link Default
- **Text Color:** `#000000`
- **Font:** `{typography.button-lg}` (14px, weight 500)
- **Background:** Transparent
- **Border:** None
- **Border Radius:** `{rounded.xs}` (6px, measured context)
- **Padding:** `8px 16px` (touch target padding)
- **Hover State:** Color may shift to accent or background lights

#### Link Default SM
- **Text Color:** `oklch(0.556 0 0)` (mid-gray)
- **Font:** `{typography.body-md}` (16px, weight 400)
- **Background:** Transparent
- **Border:** None
- **Padding:** 0px
- **Hover State:** Text or background color changes per CSS custom property

## 5. Layout Principles

### Spacing System
The spacing scale uses a base unit of 4px (one-quarter rem assuming 16px root) with a modular progression:
- **`{spacing.xxs}`** = 4px — micro-gaps between inline elements
- **`{spacing.xs}`** = 8px — button internal padding, compact spacing
- **`{spacing.sm}`** = 12px — small component gaps
- **`{spacing.md}`** = 16px — standard container padding, body paragraph margin
- **`{spacing.lg}`** = 20px — moderate section spacing
- **`{spacing.xl}`** = 24px — card padding, large gaps
- **`{spacing.xxl}`** = 32px — major subsection spacing
- **`{spacing.xxxl}`** = 40px — large content blocks
- **`{spacing.section}`** = 48px — full-page section separation
- **`{spacing.band}`** = 52px — hero/feature band padding

Use `{spacing.md}` (16px) as default container padding on all breakpoints. Scale up to `{spacing.xl}` or `{spacing.xxl}` for major sections. Pair with `{spacing.section}` (48px) or `{spacing.band}` (52px) to separate distinct page regions.

### Grid & Container
- **Max Width:** 1400px at 1440px+ viewports; responsive scaling below
- **Content Column:** Measured at 1440px = 1400px; 1280px = 1216px; 1024px = 960px; 768px = 704px; 375px = 311px
- **Grid Columns:** 4 columns across all breakpoints (measured at 375px, 768px, 1024px, 1280px, 1440px)
- **Section Padding X:** 0px (measured uniformly — no horizontal padding; margins or grid gaps manage spacing)
- **Strategy:** Full-bleed layout with internal grid; content reflows but does not add outer padding at any breakpoint

### Whitespace Philosophy
Whitespace is treated as a design element, not an afterthought. Large heading sizes, generous line-heights (1.25–1.78 for text), and `{spacing.section}` gaps between sections create visual breathing room. Card and container interiors use `{spacing.xl}` (24px) padding to prevent text crowding. Micro-spacing (`{spacing.xxs}`, `{spacing.xs}`) is reserved for tight component internals (buttons, links). This approach prioritizes readability and visual calm over information density.

### Border Radius Scale
- **`{rounded.none}`** = 0px — sharp corners on images, overlays, and legacy elements
- **`{rounded.xs}`** = 8px — standard button, input, and moderate-radius components
- **`{rounded.sm}`** = 14px — cards and larger container shapes
- **`{rounded.full}`** = 9999px — pill-shaped buttons and fully rounded interactive elements (text buttons, badges)

Apply `{rounded.xs}` (8px) as the default for interactive components (buttons, inputs). Use `{rounded.sm}` (14px) for cards and surface containers. Reserve `{rounded.full}` (9999px) for ghost buttons and accent UI elements seeking a modern, friendly appearance. Avoid mixing radii within a single component family.

## 6. Depth & Elevation

| Level | Treatment | Use |
|---|---|---|
| Flat (Base) | No shadow (`rgba(0, 0, 0, 0) 0px 0px 0px 0px`) | Neutral surfaces, links, navigation backgrounds |
| Micro (SM) | `rgba(0, 0, 0, 0.05) 0px 1px 2px 0px` | Buttons, subtle lift, gentle hover states |
| Micro (LG) | `rgba(0, 0, 0, 0.1) 0px 10px 15px -3px, rgba(0, 0, 0, 0.1) 0px 4px 6px -4px` | Deeper custom elevations, rarely used |
| Micro (XL) | `rgba(0, 0, 0, 0.1) 0px 4px 6px -1px, rgba(0, 0, 0, 0.1) 0px 2px 4px -2px` | Custom elevated surfaces |

**Shadow Philosophy:**  
The design system employs a **layered-micro** elevation strategy. Shadows are subtle, single-layer treatments (1–2px vertical offset, 2–4% opacity) designed to suggest separation without visual noise. Most components (cards, navigation, footers) render flat (no shadow) to maintain minimalist clarity. Only buttons and interactive elements receive the baseline micro-shadow (`rgba(0, 0, 0, 0.05) 0px 1px 2px 0px`), creating a barely-perceptible lift that signals interactivity. No "stacking" effect; elevation is communicated primarily through color and position, not shadow depth.

### Opacity Levels
- **0.02 (2%)** — extremely subtle overlays or disabled state tints
- **0.18 (18%)** — light semi-transparent fills or hover backgrounds
- **0.21 (21%)** — moderate opacity for secondary overlays
- **0.24 (24%)** — mid-opacity for significant background tints
- **0.30 (30%)** — heavier opacity for pronounced disabled or inactive states
- **0.99 (99%)** — near-full opacity for slight transparency on opaque elements

These opacity stops support color-mixing functions (e.g., `color-mix(in oklab, var(--primary) 10%, transparent)`) for hover states and state indicators. Most interactive states use 18–24% opacity overlays rather than full-opacity backgrounds.

### Z-index / Layering
- **Base Layer** = 0 — standard document flow
- **Dropdown / Overlay A** = 10 — first-level dropdowns, tooltips
- **Dropdown / Overlay B** = 30 — nested dropdowns
- **Dropdown / Overlay C** = 50 — modal overlays, sticky headers, top-layer modals

Use z-index sparingly. The `10 → 30 → 50` progression ensures dropdowns layer above base content, modals layer above dropdowns, and toasts/notifications sit at the very top. Do not invent intermediate z-index values; stick to this hierarchy to maintain predictable layering.

## 7. Do's and Don'ts

### Do
- **Use `{spacing.md}` (16px) as the default padding** for all containers and sections; scale up to `{spacing.xl}` or `{spacing.xxl}` only for major blocks.
- **Apply `{rounded.xs}` (8px) to all interactive components** (buttons, inputs, cards) for visual consistency.
- **Pair bold display typography (`{typography.display-md}` or `{typography.display-lg}`) with generous line-height** (1.25) and negative letter-spacing (-0.35px to -1.2px on larger sizes) to maximize visual hierarchy and readability.
- **Use the accent color (`#FB2C36`) sparingly** — reserve it for primary CTAs, hero buttons, and critical brand moments. Do not color-code semantic states (error, success) without explicit design guidance.
- **Employ color-blocking** (white backgrounds, black text, accent accents) as your primary depth and contrast strategy; avoid layering multiple shadows or gradients.
- **Respect the 4-column grid structure** across all breakpoints; responsive behavior reflows content width, not column count.
- **Implement hover states** via opacity shifts (0.9 or 0.99) or `color-mix()` functions for subtle, non-jarring interactions.
- **Build micro-elevations** with the baseline shadow (`rgba(0, 0, 0, 0.05) 0px 1px 2px 0px`) on buttons and interactive elements only.

### Don't
- **Do not invent semantic colors** (error red, success green, warning orange) without explicit extraction or design approval. The site does not declare these; CSS custom properties reference them but are not measured. See Known Gaps.
- **Do not mix border-radius values** within a component family (e.g., some buttons 8px, others 0px). Choose one radius per component type and apply uniformly.
- **Do not exceed 48px padding** on major sections; the spacing scale caps at `{spacing.section}` (48px) and `{spacing.band}` (52px) for full-page separation.
- **Do not apply shadows to cards or neutral containers.** Reserve shadows for interactive (buttons) and elevated (modals, overlays) elements only.
- **Do not use negative letter-spacing on body text** or headings smaller than `{typography.display-md}` (48px). Tracking is reserved for display-level type to create visual emphasis.
- **Do not change the 4-column grid structure** across breakpoints. Layout adapts by reflowing content width (311px at mobile, 1400px at desktop), not by adding/removing columns.
- **Do not create undeclared z-index values.** Use only 0, 10, 30, 50. All layering can be expressed within this hierarchy.
- **Do not stack multiple opacity overlays.** Use a single `color-mix()` or opacity value per interactive state; layering compounds and muddies the visual result.

## 8. Responsive Behavior

### Breakpoints

| Viewport (px) | Name | Content Width (px) | Grid Columns | Nav Links Visible | Menu Toggle | Display Heading Size | Body Text Size | Section Padding X |
|---|---|---|---|---|---|---|---|---|
| 375 | Mobile | 311 | 4 | 0 | Yes | 36px (`{typography.display-md}` reduced) | 16px | 0px |
| 768 | Tablet | 704 | 4 | 0 | Yes | 60px (`{typography.display-lg}`) | 16px | 0px |
| 1024 | Desktop SM | 960 | 4 | 1 | Yes | 60px (`{typography.display-lg}`) | 16px | 0px |
| 1280 | Desktop MD | 1216 | 4 | 1 | Yes | 60px (`{typography.display-lg}`) | 16px | 0px |
| 1440 | Desktop LG | 1400 | 4 | 1 | Yes | 60px (`{typography.display-lg}`) | 16px | 0px |

**Key Observations:**
- **Grid columns remain 4 across all sizes** — no column collapsing. Responsiveness comes from container width reflow (311px → 1400px), not from adding or removing columns.
- **Navigation link visibility changes at 1024px.** Below 1024px, all navigation links hide behind a menu toggle. At 1024px and above, 1 link becomes visible inline.
- **Display heading shrinks only below 768px** (36px on mobile vs. 60px on tablet+). Body text stays 16px uniformly.
- **Section padding-x is 0px at all breakpoints** — no horizontal padding added by layout; internal grid and component padding handle spacing.

### Touch Targets
- **Minimum interactive target size:** 36px (height) × `{spacing.md}` (16px horizontal padding)
- **Button padding standard:** `{spacing.xs}` (8px) vertical × `{spacing.md}` (16px) horizontal = 36px height total
- **Link padding:** Consistent 36px height with `{spacing.md}` padding for tap-friendly surfaces
- **Form inputs:** 36px height minimum with `{spacing.xs}` vertical and `{spacing.md}` horizontal padding
- Ensure all interactive elements (buttons, links, form fields) meet or exceed 36px height and 44px minimum touch target on mobile viewports.

### Collapsing Strategy
- **Mobile (375px–767px):**
  - Content width: 311px (full viewport minus side margins)
  - Navigation: menu toggle only; hide text links
  - Display headings: scale down to 36px (vs. 60px desktop)
  - Buttons and cards: stack vertically; maintain full width or `{spacing.md}` margins
  - Grid: 4 columns maintained; components reflow to narrower cells
  
- **Tablet (768px–1023px):**
  - Content width: 704px
  - Navigation: menu toggle still visible; no inline links
  - Display headings: return to 60px
  - Layout: 4-column grid; components begin to distribute horizontally
  
- **Desktop (1024px+):**
  - Content width: 960px–1400px (scales with viewport)
  - Navigation: menu toggle visible; 1+ text link appears inline
  - Display headings: 60px standard
  - Layout: full 4-column grid; components span multiple columns as designed
  - Spacing: `{spacing.section}` (48px) and `{spacing.band}` (52px) separate major blocks

## 9. Agent Prompt Guide

### Quick Color Reference
- **Primary CTA / Accent:** Red (`#FB2C36`) — fill color for primary buttons and brand moments
- **Background / Surface:** White (`#FFFFFF`) — card, container, and canvas backgrounds
- **Text / Foreground:** Black (`#000000`) — primary body text and headings
- **Borders / Hairlines:** Light Gray (`#EBEBEB` or `oklch(0.922 0 0)`) — subtle input and button borders

### Iteration Guide

1. **Start with 4-column grid at all breakpoints.** Content width reflows (311px mobile → 1400px desktop), but grid structure does not change. Use this for layout consistency.

2. **Apply `{spacing.md}` (16px) as default container padding.** Scale to `{spacing.xl}` (24px) for cards and major sections. Never add section padding-x; let grid gaps and internal padding manage spacing.

3. **Use `{rounded.xs}` (8px) for buttons, inputs, and moderate containers; `{rounded.sm}` (14px) for cards; `{rounded.full}` (9999px) for pill-shaped ghost buttons.** Do not mix radii within component families.

4. **Build hierarchy via typography size and weight, not color.** Display sizes use bold weights (500–700) and negative letter-spacing (-0.35px to -1.2px). Body text is 400 weight with 0 tracking. Reserve the accent color for CTAs and critical interactions.

5. **Employ micro-shadows sparingly.** Apply `rgba(0, 0, 0, 0.05) 0px 1px 2px 0px` only to buttons and interactive elements. Keep cards, navigation, and neutral surfaces flat (no shadow).

6. **Implement hover states via opacity or `color-mix()`.** Example: button hover = `opacity: 0.9` or background = `color-mix(in oklab, var(--primary) 10%, transparent)`. Do not add box-shadow on hover unless interaction is raised (modal, dropdown).

7. **Hide nav links below 1024px; show menu toggle at all sizes.** At 1024px+, reveal inline links and keep toggle visible. Prioritize mobile usability without cramping.

8. **Scale display headings (36px mobile → 60px tablet+) for responsive impact.** Body and button text remain 16px and 14px respectively. Maintain line-height (1.25 for display, 1.5 for body) across sizes.

9. **Reserve z-index values: 0 (base), 10 (dropdown), 30 (nested dropdown), 50 (modal).** Do not invent intermediate z-index; use this hierarchy exclusively.

10. **Do not declare semantic status colors (error, success, warning) without extraction.** If the site references CSS custom properties like `--destructive` or `--success`, note them as gaps; implement only measured colors from this document.

## 10. Known Gaps

- **Semantic status color ramp not measured.** The extracted tokens reference CSS custom properties (`--destructive`, `--success`, `--warning`, `--info`), but these are not defined in the measured stylesheets. Implementation should not assume these colors exist; they belong under "Known Gaps" unless explicit design guidance provides them.

- **Interaction states partially inferred.** Hover, focus, and disabled states are declared in the stylesheets but map to CSS custom properties and `color-mix()` functions that are not fully resolved. Specific hover background colors (e.g., exact hex values for `--accent`, `--primary`, `--secondary` hover backgrounds) are not extracted; rely on the opacity and `color-mix()` patterns provided.

- **One page analyzed.** Only the public landing page (https://saas-magicui.vercel.app/) was inspected. Authenticated surfaces, dashboard, onboarding, and internal tools were not visited; their design may differ from this document.

- **Cross-origin stylesheets unreadable.** Some external CSS files may have been blocked by CORS policy; embedded styles on the page were measured, but third-party font or utility libraries may carry additional styles not reflected here.

- **Two colors have no measured role.** `#FFFFFF` (white) and `#000000` (black) are foundational neutrals assigned to canvas/background and text/foreground respectively; they are not semantic "primary" or "secondary" but rather the backbone of the color system.

- **Gradient decorative uses not implemented.** The extraction identified linear-gradients used as background decorations on sections (fade-to-transparent overlays) but these are visual polish, not structural CSS. They are not included in component variant definitions; treat them as optional enhancements.

- **Opacity levels extracted but not all applied.** Opacity values (0.02, 0.18, 0.21, 0.24, 0.30, 0.99) are present in the stylesheets, but their precise application to disabled states, overlays, or other interactive contexts was not fully disambiguated. Use the provided opacity scale as a guide; specific application requires design review.

- **Z-index scale inferred from three values (10, 30, 50).** The extraction found only three distinct z-index values. If the full system requires intermediate levels (e.g., z-index 20 for sticky headers), they are not documented here.

- **Dark mode or theme switching not observed.** The landing page does not declare or measure a dark mode variant. The design is light-mode-only per the extraction; dark mode support, if present, is not reflected in this document.
