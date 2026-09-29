# FieldFlow dashboard implementation plan

## Goal
Build a frontend-only operations dashboard for HVAC, plumbing, and electrical business owners and dispatchers. It will use realistic in-memory mock data, a typed API boundary ready for Django REST Framework, responsive light/dark layouts, polished loading states, subtle depth, and purposeful motion.

## Foundation
- Replace the placeholder screen with FieldFlow and establish a feature-based folder structure.
- Define all Customer, Technician, Job, JobPhoto, Invoice, and InvoiceLineItem types.
- Add `/src/api` modules for auth, jobs, customers, technicians, and invoices, backed by shared mock data and simulated latency.
- Prepare a reusable request helper for `VITE_API_BASE_URL`, session cookies, and CSRF headers so each mock method maps cleanly to a future DRF endpoint.
- Seed approximately 15 jobs, 8 customers, 5 technicians, and enough invoices/activity to populate every view.

## App shell and access
- Build a responsive owner/dispatcher shell with a collapsible desktop sidebar and mobile navigation.
- Add a mock session-backed login flow, invalid-credential feedback, session-expired messaging, logout, and protected-page redirects.
- Add global theme support, consistent notifications, confirmation dialogs, keyboard focus states, and route-level loading feedback.

## Core pages
- Dashboard: KPI summaries, today’s schedule, recent activity, and a compact revenue chart.
- Jobs: searchable/filterable/sortable/paginated table plus list/calendar view switching.
- New Job: validated form with existing/new customer selection, service details, date/time, priority, address, available technician assignment, and conflict warnings.
- Job detail: status timeline, customer and technician information, notes, photo lightbox, reassignment, and completed-only invoice creation.
- Dispatch board: interactive week grid with drag-to-reschedule and drag-to-reassign behavior against mock state.
- Customers: searchable list, add/edit flow, and customer detail with job and invoice history.
- Technicians: status/specialty overview, today’s assignments, and add/edit flow.
- Invoices: filtered list, completed-job invoice builder with editable line items and live tax totals, and print-friendly invoice detail with send/copy-payment-link actions plus a simulated paid update.
- Settings: company profile and user profile forms.

## Visual and motion system
- Use a trustworthy deep-blue, neutral, and urgent-orange semantic token system; preserve consistent status colors in both themes.
- Add layered surfaces and restrained perspective/tilt effects to KPI and schedule elements for depth without sacrificing readability.
- Use smooth skeleton-to-content transitions, a branded route loader, animated chart drawing, dialog transitions, sidebar motion, button feedback, drag affordances, and small status-change animations.
- Respect `prefers-reduced-motion`, keep controls stable during animation, and avoid decorative motion that slows dispatcher workflows.

## Quality and validation
- Use TanStack Router’s project-native route system, TanStack Query, React Hook Form, Zod, existing accessible UI primitives, and reusable components.
- Give every content route unique metadata.
- Verify loading, empty, error, filtering, creation, reassignment, invoice totals, responsive navigation, theme switching, and the main login-to-job workflow.
- Validate desktop and mobile layouts in the live preview, check reduced motion behavior, and leave the project build clean.

## Technical notes
- This project is fixed to TanStack Router rather than React Router DOM; it provides the requested routed experience without replacing the framework’s supported router.
- All persistence remains in frontend mock modules for now. Refreshing the app resets edited mock data.
- Suggested structure: `src/api`, `src/types`, `src/features/{auth,dashboard,jobs,customers,technicians,invoices,settings}`, `src/components/{layout,shared,ui}`, `src/lib`, and `src/routes`.
