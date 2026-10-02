<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting published git history.
<!-- LOVABLE:END -->

- Use TanStack Router file routes and client-side mock API modules because the project is frontend-only and prepared for a future Django REST Framework backend.
- Keep domain access behind `src/api` resource modules so UI features never import mock storage directly.
- Use feature folders for page implementations and route files only as metadata/rendering adapters to keep the dashboard maintainable.
- Motion Magic Studio is a single-page showcase; use Framer Motion for all interactive and scroll-driven animation to keep motion consistent.
