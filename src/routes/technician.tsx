import { createFileRoute } from "@tanstack/react-router";
import { TechnicianLoginPage } from "@/features/auth/technician-login-page";

export const Route = createFileRoute("/technician")({
  head: () => ({
    meta: [
      { title: "Technician Portal | FieldFlow" },
    ],
  }),
  component: TechnicianLoginPage,
});
