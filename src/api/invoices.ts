import { apiRequest } from "./client"; 
import { invoices as mockInvoices } from "./mock-data";
import type { Invoice } from "@/types";

export async function listInvoices(): Promise<Invoice[]> { 
  const token = typeof window !== 'undefined' ? localStorage.getItem('fieldflow-token') : null;
  try {
    return await apiRequest<Invoice[]>("/api/invoices/");
  } catch (err) {
    if (token) {
      console.error("[API] Failed to fetch invoices from backend:", err);
      return [];
    }
    console.warn("[API] Backend unavailable — using mock invoices data");
    return mockInvoices;
  }
}

export async function getInvoice(id: string): Promise<Invoice> { 
  try {
    return await apiRequest<Invoice>(`/api/invoices/${id}/`);
  } catch {
    const inv = mockInvoices.find(i => i.id === id);
    if (!inv) throw new Error(`Invoice ${id} not found`);
    return inv;
  }
}

export async function saveInvoice(invoice: Invoice): Promise<Invoice> { 
  try {
    if (invoice.id && !invoice.id.startsWith("new-")) {
      return await apiRequest<Invoice>(`/api/invoices/${invoice.id}/`, {
        method: 'PATCH',
        body: JSON.stringify(invoice)
      });
    }
    return await apiRequest<Invoice>("/api/invoices/", {
      method: 'POST',
      body: JSON.stringify({
        ...invoice,
        id: invoice.id && !invoice.id.startsWith("new-") ? invoice.id : `INV-${Date.now()}`
      })
    });
  } catch {
    // Mock save
    const newInvoice = { ...invoice, id: invoice.id && !invoice.id.startsWith("new-") ? invoice.id : `INV-${Date.now()}` };
    mockInvoices.push(newInvoice);
    return newInvoice;
  }
}

export async function sendInvoiceTelegram(id: string, image_data?: string): Promise<{status?: string, error?: string}> {
  try {
    return await apiRequest<{status?: string, error?: string}>(`/api/invoices/${id}/send_telegram/`, {
      method: 'POST',
      body: image_data ? JSON.stringify({ image_data }) : undefined
    });
  } catch {
    return { error: "Backend unavailable — Telegram send skipped" };
  }
}
