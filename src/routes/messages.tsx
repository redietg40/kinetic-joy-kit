import { createFileRoute } from "@tanstack/react-router";
import { MessagesPage } from "@/features/messages/messages-page";

export const Route = createFileRoute("/messages")({
  head: () => ({
    meta: [
      { title: "Messages · FieldFlow" },
    ],
  }),
  component: MessagesPage,
});
