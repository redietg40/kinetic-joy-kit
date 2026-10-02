import { apiRequest } from "./client"; 
import type { Customer } from "@/types";

export async function listCustomers() { 
  return apiRequest<Customer[]>("/api/customers/"); 
}

export async function getCustomer(id: string) { 
  return apiRequest<Customer>(`/api/customers/${id}/`); 
}

export async function saveCustomer(input: Omit<Customer, "id" | "created_at"> & { id?: string }) { 
  if (input.id) {
    return apiRequest<Customer>(`/api/customers/${input.id}/`, {
      method: 'PATCH',
      body: JSON.stringify(input)
    });
  }
  return apiRequest<Customer>("/api/customers/", {
    method: 'POST',
    body: JSON.stringify({
      ...input,
      id: `c${Date.now()}` // Mock ID generation for the API if it expects it
    })
  });
}
