import { createFileRoute } from "@tanstack/react-router";
import { ChapaMockPage } from "@/features/booking/chapa-mock-page";

export const Route = createFileRoute("/chapa-checkout")({
  component: ChapaMockPage,
});
