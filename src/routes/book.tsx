import { createFileRoute } from "@tanstack/react-router";
import { CustomerPortal } from "@/features/customer/customer-portal";

export const Route = createFileRoute("/book")({
  head: () => ({
    meta: [
      { title: "Book a Service | FieldFlow" },
      { name: "description", content: "Schedule a verified home repair with professional technicians." },
    ],
  }),
  component: () => <CustomerPortal initialTab="book" />,
});
