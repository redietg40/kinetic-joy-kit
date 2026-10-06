import { apiRequest } from "./client"; 
import type { Invoice } from "@/types";

export async function listInvoices() { 
  return apiRequest<Invoice[]>("/api/invoices/"); 
}

export async function getInvoice(id: string) { 
  return apiRequest<Invoice>(`/api/invoices/${id}/`); 
}

export async function saveInvoice(invoice: Invoice) { 
  if (invoice.id && !invoice.id.startsWith("new-")) {
    return apiRequest<Invoice>(`/api/invoices/${invoice.id}/`, {
      method: 'PATCH',
      body: JSON.stringify(invoice)
    });
  }
  return apiRequest<Invoice>("/api/invoices/", {
    method: 'POST',
    body: JSON.stringify({
      ...invoice,
      id: invoice.id && !invoice.id.startsWith("new-") ? invoice.id : `INV-${Date.now()}`
    })
  });
}

export async function sendInvoiceTelegram(id: string, image_data?: string) {
  return apiRequest<{status?: string, error?: string}>(`/api/invoices/${id}/send_telegram/`, {
    method: 'POST',
    body: image_data ? JSON.stringify({ image_data }) : undefined
  });
}
