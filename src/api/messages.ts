import { apiRequest } from "./client";

export interface ChatMessage {
  id: number;
  sender: string;
  receiver: string;
  content: string;
  timestamp: string;
  is_read: boolean;
}

export async function listMessages(): Promise<ChatMessage[]> {
  return apiRequest<ChatMessage[]>("/api/messages/");
}

export async function sendMessage(data: { sender: string; receiver: string; content: string }): Promise<ChatMessage> {
  return apiRequest<ChatMessage>("/api/messages/", {
    method: "POST",
    body: JSON.stringify(data),
  });
}
