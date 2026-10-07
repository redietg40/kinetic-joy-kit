import { createFileRoute } from "@tanstack/react-router";
import { ReportsPage } from "@/features/reports/reports-page";

export const Route = createFileRoute("/reports")({
  head: () => ({
    meta: [
      { title: "Analytics & Reports | FieldFlow" },
    ],
  }),
  component: ReportsPage,
});
