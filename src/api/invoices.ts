import { delay } from "./client"; import { invoices } from "./mock-data"; import type { Invoice } from "@/types";
export async function listInvoices(){ await delay(500); return [...invoices]; } // GET /api/invoices/
export async function getInvoice(id:string){ await delay(250); return invoices.find(i=>i.id===id) ?? null;} // GET /api/invoices/{id}/
export async function saveInvoice(invoice:Invoice){ await delay(); const existing=invoices.find(i=>i.id===invoice.id); if(existing) Object.assign(existing,invoice); else invoices.unshift(invoice); return invoice;} // POST /api/invoices/
