import { apiRequest } from "./client"; 
import { customers as mockCustomers } from "./mock-data";
import type { Customer } from "@/types";

export async function listCustomers(): Promise<Customer[]> { 
  const token = typeof window !== 'undefined' ? localStorage.getItem('fieldflow-token') : null;
  try {
    return await apiRequest<Customer[]>("/api/customers/");
  } catch (err) {
    if (token) {
      console.error("[API] Failed to fetch customers from backend:", err);
      return [];
    }
    console.warn("[API] Backend unavailable — using mock customers data");
    return mockCustomers;
  }
}

export async function getCustomer(id: string): Promise<Customer> { 
  try {
    return await apiRequest<Customer>(`/api/customers/${id}/`);
  } catch {
    const c = mockCustomers.find(c => c.id === id);
    if (!c) throw new Error(`Customer ${id} not found`);
    return c;
  }
}

export async function saveCustomer(input: Omit<Customer, "id" | "created_at"> & { id?: string }): Promise<Customer> { 
  try {
    if (input.id) {
      return await apiRequest<Customer>(`/api/customers/${input.id}/`, {
        method: 'PATCH',
        body: JSON.stringify(input)
      });
    }
    return await apiRequest<Customer>("/api/customers/", {
      method: 'POST',
      body: JSON.stringify({
        ...input,
        id: `c${Date.now()}`
      })
    });
  } catch {
    // Mock save
    if (input.id) {
      const idx = mockCustomers.findIndex(c => c.id === input.id);
      if (idx !== -1) {
        mockCustomers[idx] = { ...mockCustomers[idx], ...input };
        return mockCustomers[idx];
      }
    }
    const newCustomer: Customer = {
      ...input,
      id: `c${Date.now()}`,
      created_at: new Date().toISOString(),
    };
    mockCustomers.push(newCustomer);
    return newCustomer;
  }
}
