export type Specialty = "HVAC" | "Plumbing" | "Electrical";
export type TechnicianStatus = "available" | "on_job" | "off_duty";
export type JobStatus = "scheduled" | "in_progress" | "completed" | "cancelled";
export type JobPriority = "low" | "normal" | "urgent";
export type InvoiceStatus = "draft" | "sent" | "paid" | "overdue";

export interface Customer { id: string; name: string; phone: string; email: string; address: string; telegram_username?: string; notes: string; created_at: string }
export interface Technician { id: string; name: string; phone: string; email: string; specialty: Specialty; status: TechnicianStatus }
export interface JobPhoto { url: string; uploaded_at: string }
export interface Job { id: string; customer_id: string; technician_id: string | null; title: string; description: string; service_type: Specialty; scheduled_at: string; address: string; status: JobStatus; priority: JobPriority; technician_notes: string; photos: JobPhoto[]; completed_at: string | null; booking_fee_paid?: boolean; booking_fee_amount?: number; booking_chapa_tx_ref?: string }
export interface InvoiceLineItem { description: string; qty: number; unit_price: number }
export interface Invoice { id: string; job_id: string; customer_id: string; line_items: InvoiceLineItem[]; subtotal: number; tax: number; total: number; currency: "ETB"; status: InvoiceStatus; payment_method: "Chapa"; chapa_tx_ref: string; issued_at: string; paid_at: string | null }
export interface SessionUser { id: string; name: string; email: string; role: "Owner" | "Dispatcher" }
