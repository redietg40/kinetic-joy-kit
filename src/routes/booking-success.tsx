import { createFileRoute } from "@tanstack/react-router";
import { BookingSuccessPage } from "@/features/booking/booking-success-page";

export const Route = createFileRoute("/booking-success")({
  component: BookingSuccessPage,
});
