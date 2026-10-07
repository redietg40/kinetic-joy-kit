import { createFileRoute } from "@tanstack/react-router";
import { CustomerPortal } from "@/features/customer/customer-portal";

export const Route = createFileRoute("/customer")({
  head: () => ({
    meta: [
      { title: "Customer Portal | FieldFlow" },
    ],
  }),
  component: CustomerPortal,
});
