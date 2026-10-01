# AI-Assisted Development Rules (RULES.md)

This document defines the strict engineering guidelines and operating rules for all AI models, engineers, and contributors working on the AutoAudit codebase. Every modification must comply with these directives.

---

## 1. General Engineering Rules

1. **Inspect Before Modifying:** Always inspect existing components, services, and schemas before creating new code or modifying existing files. Never guess APIs or property names.
2. **Reuse Existing Components:** Reuse existing UI components (`Navbar`, `OrderModal`, `MyOrdersModal`, `AdminPanel`, `ToastProvider`, `Logo`, etc.) instead of creating redundant duplicates.
3. **No Unnecessary Rewrites:** Never rewrite or delete working functionality unless explicitly requested by the user or required to resolve an identified defect.
4. **Avoid Duplicate Code:** Maintain single sources of truth for business logic (e.g. `src/services/api.ts` for API queries, `server/supabase.ts` for database adapters, `src/types/index.ts` for shared interfaces).
5. **Focused Diffs:** Keep changes focused on the task at hand. Do not reformat or churn unrelated code, functions, or styling.
6. **Preserve Backward Compatibility:** Ensure existing API routes, customer order lookup logic, and database schemas remain functional across updates.

---

## 2. React & Frontend Conventions

1. **Functional Components Only:** Exclusively use React functional components with standard React 19 hooks (`useState`, `useEffect`, `useCallback`, `useMemo`, `useContext`). Class components are prohibited.
2. **Component Maintainability & Size:** Decompose monolithic JSX trees into clean, single-responsibility subcomponents (e.g. table rows, metric cards, status pills).
3. **Strict Typing:** All props, component states, and event handlers must be explicitly typed using TypeScript. Do not use `any` unless wrapping un-typed third-party payloads.
4. **Toast Feedback:** Never invoke browser `window.alert()`, `confirm()`, or `prompt()`. All notifications must use the `useToast` hook:
   ```typescript
   const { showToast } = useToast();
   showToast({
     title: 'Order Updated',
     message: 'Status transitioned to Delivered.',
     type: 'success'
   });
   ```
5. **No Broken Imports:** Always verify relative import paths and case-sensitivity when creating or moving files.

---

## 3. Styling & Design System Rules

1. **Follow `DESIGN.md`:** All UI additions must adhere to the AutoAudit design system outlined in `docs/DESIGN.md`.
2. **Tailwind CSS v4 Standard:** Use Tailwind CSS utility classes exclusively. Do not create separate `.css` files, CSS modules, or inline CSS style objects.
3. **Zero-Pill Discipline:** Cards, containers, inputs, and modal wrappers must use geometric squircle borders (`rounded-xl` or `rounded-2xl`). Do not apply pill styling (`rounded-full`) to structural containers.
4. **No External CSS Frameworks:** Do not introduce Bootstrap, Material UI, Chakra UI, Ant Design, or separate UI component libraries without explicit user instruction.
5. **Consistent Palette:** Strictly use the defined palette tokens:
   - Primary dark: `#0B132B`, `#0F172A`
   - Backgrounds: `#FFFFFF`, `#F8FAFC`, `#F1F5F9`, `#E2E8F0`
   - Primary: `#1D4ED8`, `#2563EB`
   - Secondary / Success: `#059669`, `#10B981`
   - Warnings & Alerts: `#D97706`, `#DC2626`

---

## 4. Database & Supabase Rules

1. **Follow the Dual-Persistence Architecture:** AutoAudit uses an in-memory cache synchronized with Supabase PostgreSQL. Never bypass or break this dual-persistence pipeline.
2. **Document Schema Modifications:** Never alter the database schema or add columns without updating `supabase/schema.sql`, `server/supabase.ts`, and `docs/MEMORY.md`.
3. **Safe Error Isolation:** All queries to Supabase must handle missing tables (`isTableMissingError`) gracefully so the application continues operating smoothly on local memory fallback if cloud tables are initializing.
4. **Validate Input Data:** Enforce data validation on currency amounts, VIN strings, and customer emails before saving to the database.

---

## 5. Security & Credentials Rules

1. **NEVER Expose Secrets in Frontend:** 
   - Never import, bundle, or reference `SUPABASE_SERVICE_ROLE_KEY` in files under `src/`.
   - Client code may ONLY access `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
2. **No Hardcoded Credentials:** Never hardcode API keys, database connection strings, or bearer tokens in source code files.
3. **Environment Template Sync:** Whenever an environment variable is introduced, immediately document it in `.env.example`.
4. **Row Level Security (RLS):** Keep Supabase RLS policies enabled on all public tables (`orders`, `services`, `coupons`, `emails`).
5. **Sanitize Search & Filter Queries:** Validate and sanitize all query parameters in Express endpoints to prevent parameter injection and denial-of-service edge cases.

---

## 6. AI Development Behavior

1. **Read Before Writing:** At the start of every task, read the relevant documents in `docs/` (`PRD.md`, `ARCHITECTURE.md`, `DESIGN.md`, `RULES.md`, `TASKS.md`, `MEMORY.md`).
2. **Check Existing Code First:** Check existing implementations in `src/` and `server/` before creating new utilities.
3. **Ask Clarifying Questions:** If user requirements are contradictory or underspecified, clarify before executing large architectural changes.
4. **No Silent Breakages:** Always run compilation (`compile_applet`) and verify build health before concluding turns.
5. **Update Documentation:** Whenever a new feature is implemented, mark it complete in `docs/TASKS.md` and document decisions in `docs/MEMORY.md`.

---

## 7. Quality & Verification Standards

1. **State Handling:** Every data-fetching UI view must cleanly handle:
   - *Loading State:* Subtle spinners or skeleton placeholders (`GearLoader.tsx`).
   - *Empty State:* Friendly illustration/icon with clear call-to-action (e.g. "No orders found").
   - *Error State:* Human-readable explanation with a retry option.
   - *Success State:* Visual confirmation and clear next steps.
2. **Mobile Responsiveness:** Verify responsiveness across viewport widths from 320px to 1920px. Ensure inputs and buttons do not overflow small screens.
3. **Console Hygiene:** Ensure the browser console and server logs remain clean. Address warnings and remove diagnostic console statements before shipping.
4. **Type Checking:** Verify with `tsc --noEmit` that the TypeScript compiler reports 0 errors and 0 warnings.
