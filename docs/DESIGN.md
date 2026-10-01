# UI/UX Design System Document (DESIGN.md)

## Brand Identity

### Brand Name
**AutoAudit** — *The Vehicle Intelligence & History Authority*

### Brand Personality & Visual Style
- **Automotive Technology:** Clean, rigorous, engineered, precise.
- **Trustworthy & Authoritative:** High-contrast neutral foundations, deep navy tones, federal agency compliance accents.
- **Premium & Professional:** Modern enterprise aesthetics, crisp borders, subtle drop shadows, generous whitespace.
- **Minimal but Informative:** Dense data presented with immaculate visual hierarchy; no decorative clutter or gimmicks.
- **Zero-Pill Discipline:** Square-rounded geometric corners (`rounded-lg`, `rounded-xl`) preferred over pill-shaped elements for cards, modals, and containers.

---

## Color System

```
PRIMARY DARK (Navy Foundations)
  #0B132B  -- Slate Obsidian (Deep Header & Hero Background)
  #0F172A  -- Slate 900 (High-contrast text & primary dark surfaces)

BACKGROUNDS & SURFACES
  #FFFFFF  -- Pure White (Primary card surfaces & modal dialogs)
  #F8FAFC  -- Slate 50 (App canvas background & subtle table rows)
  #F1F5F9  -- Slate 100 (Secondary input fills & badge backgrounds)
  #E2E8F0  -- Slate 200 (Hairline dividers & structural card borders)

PRIMARY ACCENTS (Confidence & Action)
  #1D4ED8  -- Blue 700 (Primary button hover & active states)
  #2563EB  -- Blue 600 (Primary action buttons, active links, progress bars)
  #3B82F6  -- Blue 500 (Focus rings & glowing highlights)
  #EFF6FF  -- Blue 50 (Subtle selection card background)

SECONDARY ACCENTS (Verification & Success)
  #059669  -- Emerald 600 (Verified checkmarks, clean title badges, success buttons)
  #10B981  -- Emerald 500 (Status indicators & live pulses)
  #ECFDF5  -- Emerald 50 (Verified status background badges)

WARNING & ALERT ACCENTS
  #D97706  -- Amber 600 (Warnings, salvage alerts, pending status)
  #FEF3C7  -- Amber 100 (Warning badge background)
  #DC2626  -- Rose 600 (Total loss flags, error messages, rollback warnings)
  #FEE2E2  -- Rose 100 (Error badge background)

TYPOGRAPHY & TEXT
  #0F172A  -- Slate 900 (Headings, VIN numbers, pricing figures)
  #334155  -- Slate 700 (Subheadings & label titles)
  #64748B  -- Slate 500 (Body copy, helper hints, captions)
  #94A3B8  -- Slate 400 (Placeholder text & secondary icons)
```

---

## Typography & Font Hierarchy

### Font Family
- **Primary Interface:** `Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`
- **Monospace (VINs, Order Numbers, Timestamps):** `ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace`

### Scale & Hierarchy

| Token | Size | Weight | Line Height | Tracking | Usage |
|---|---|---|---|---|---|
| **Display Hero** | 40px – 56px | 800 (Extrabold) | 1.15 | -0.025em | Main landing hero headline |
| **Heading 1** | 30px – 36px | 700 (Bold) | 1.25 | -0.02em | Section titles, sample report vehicle title |
| **Heading 2** | 22px – 24px | 700 (Bold) | 1.3 | -0.015em | Modal titles, pricing plan names |
| **Heading 3** | 18px – 20px | 600 (Semibold) | 1.4 | -0.01em | Card headers, subsection titles |
| **Body Large** | 16px | 400 / 500 | 1.6 | 0 | Lead paragraphs, hero subtext |
| **Body Standard** | 14px | 400 / 500 | 1.5 | 0 | Standard body copy, list items, inputs |
| **Body Small / Caption** | 12px | 500 / 600 | 1.4 | +0.01em | Badges, timestamps, helper notes |
| **Monospace Identifiers** | 13px – 15px | 700 (Bold) | 1.3 | +0.05em | 17-digit VINs, order numbers, transaction IDs |

---

## Component Specifications

### 1. Buttons

```
PRIMARY ACTION (e.g. "Run Full Audit", "Complete Order")
- Background: #2563EB (Blue 600) -> Hover: #1D4ED8 (Blue 700)
- Text: #FFFFFF, Font: 14px Semibold (font-bold)
- Padding: px-5 py-3 (Mobile: px-4 py-2.5)
- Border Radius: rounded-xl
- Shadow: shadow-sm hover:shadow-md transition-all duration-150

SECONDARY / OUTLINE (e.g. "View Sample Report", "Cancel")
- Background: #FFFFFF, Border: 1px solid #CBD5E1 (Slate 300)
- Text: #1E293B (Slate 800) -> Hover: #0F172A, Background Hover: #F8FAFC
- Border Radius: rounded-xl

SUCCESS / DOWNLOAD (e.g. "Download PDF Report")
- Background: #059669 (Emerald 600) -> Hover: #047857 (Emerald 700)
- Text: #FFFFFF, Border Radius: rounded-xl
```

### 2. Cards & Containers
- **Card Background:** `#FFFFFF`
- **Border:** `1px solid #E2E8F0` (Slate 200)
- **Border Radius:** `rounded-2xl`
- **Shadow:** `shadow-xs` or `shadow-sm`
- **Padding:** `p-5` to `p-8`
- **Header Structure:** Icon badge + bold title + subtle muted subtitle.

### 3. Forms & Inputs
- **Input Background:** `#F8FAFC` (Slate 50)
- **Border:** `1px solid #CBD5E1` (Slate 300)
- **Focus State:** `border-blue-600 ring-2 ring-blue-500/20 bg-white outline-none`
- **Height / Padding:** `h-11 px-3.5 py-2.5 text-sm`
- **VIN Input Style:** Uppercase, letter-spacing `tracking-wider`, monospace font, clear button.

### 4. Tables & Data Grids
- **Header:** Background `#F8FAFC`, uppercase `text-[11px] font-bold text-slate-500 tracking-wider`, border bottom `1px solid #E2E8F0`.
- **Row:** Height `h-14`, border bottom `1px solid #F1F5F9`, hover background `#F8FAFC/80`.
- **Cells:** Vertical alignment centered, primary text `text-slate-900 font-semibold`, secondary subtext `text-slate-500 text-xs`.

### 5. Badges & Status Indicators
- **Verified / Clean:** Background `#ECFDF5`, text `#065F46`, border `#A7F3D0` (`Clean Title`, `Verified`).
- **Processing / Active:** Background `#EFF6FF`, text `#1E40AF`, border `#BFDBFE` (`Processing`, `NMVTIS Check`).
- **Warning / Alert:** Background `#FEF3C7`, text `#92400E`, border `#FDE68A` (`Odometer Flag`, `Salvage`).
- **Critical / Total Loss:** Background `#FEE2E2`, text `#991B1B`, border `#FECACA` (`Flood Damaged`, `Stolen`).

---

## Key Interface Layouts

### 1. Navigation & Header
- **Background:** Semi-transparent blur `#0B132B/95` (or dark slate) with bottom border `rgba(255, 255, 255, 0.1)`.
- **Left:** AutoAudit Shield Logo with automotive radar pulse.
- **Center:** Navigation anchors (`Services`, `How It Works`, `Sample Report`, `FAQ`).
- **Right:** Quick Actions: "Track My Order", "Admin Portal", and primary "Check VIN" button.

### 2. Vehicle Search UI (Hero Section)
- **Tabs:** "VIN Number (17 Chars)" and "US License Plate".
- **Search Bar:** High-impact unified input container with state dropdown, input box, and glowing primary action button.
- **Trust Elements:** Directly underneath the search box: NMVTIS approved seal, 50-State Title Database badge, 256-Bit SSL encryption badge.

### 3. Vehicle Report UI (Sample & Download Modals)
- **Header Banner:** Vehicle Year, Make, Model, VIN, Title Status Badge (e.g. *CLEAN TITLE VERIFIED*), and Audit Date.
- **Quick-Scan Summary Grid:** 4 KPI blocks:
  1. *Title Brands:* 0 Reported
  2. *Accident Records:* 0 Reported
  3. *Odometer Status:* Certified Verified (e.g. 68,400 mi)
  4. *Safety Recalls:* 0 Open
- **Detailed History Sections:**
  - DMV State Title & Registration Timeline
  - Insurance Total Loss & Salvage Auction Check
  - Detailed Damage & Airbag Deployment Inspection
  - Odometer Progression Chart & Mileage Log

### 4. Admin Operations UI
- **Top Bar:** Quick stats, status filter pills, universal search box.
- **Left / Main:** Chronological orders table with real-time customer and vehicle previews.
- **Drawer / Modal:** Order Details with editable internal notes, PDF file attachment trigger, and chronological audit log timeline.
- **Settings Tab:** Live Supabase database health diagnostics card with 1-click SQL copy button.

---

## Feedback & Notification System

### Toast Notifications (`src/context/ToastContext.tsx`)
- **Placement:** Top-right (`fixed top-4 right-4 z-[9999]`), max width `384px`.
- **Visual Style:** Dark glassmorphism (`bg-slate-900/95 backdrop-blur-md text-white border border-slate-700/80`).
- **Variants:**
  - `success`: Emerald accent border with check icon
  - `info`: Blue accent border with information icon
  - `warning`: Amber accent border with alert icon
  - `error`: Rose accent border with warning icon
- **Behavior:** Auto-dismiss after 4.5 seconds with manual close trigger.

---

## Accessibility & Responsive Guidelines

### Accessibility (a11y)
- **Color Contrast:** All text pairings satisfy WCAG 2.1 AA standards (minimum contrast ratio 4.5:1 for body copy, 3:1 for large headers).
- **Focus Rings:** Distinct keyboard navigation focus rings (`ring-2 ring-blue-500 ring-offset-2`).
- **Semantic HTML:** Strict use of `<main>`, `<header>`, `<footer>`, `<section>`, `<article>`, `<dialog>`, and accessible button roles.

### Responsive Breakpoints
- **Mobile (`< 640px`):** Single-column layout, full-width buttons, collapsible menus, stacked form inputs.
- **Tablet (`640px - 1024px`):** 2-column service card layouts, condensed admin table columns.
- **Desktop (`> 1024px`):** 3-column service tier comparison, side-by-side admin workspace, expansive report preview.
