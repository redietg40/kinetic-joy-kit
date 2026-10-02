import { createFileRoute } from '@tanstack/react-router';
import { BookingPage } from '@/features/booking/booking-page';

export const Route = createFileRoute('/book')({
  component: BookingPage,
});
