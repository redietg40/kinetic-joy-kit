import { apiRequest } from "./client"; 
import { technicians as mockTechnicians } from "./mock-data";
import type { Technician } from "@/types";

export async function listTechnicians(): Promise<Technician[]> { 
  const token = typeof window !== 'undefined' ? localStorage.getItem('fieldflow-token') : null;
  try {
    return await apiRequest<Technician[]>("/api/technicians/");
  } catch (err) {
    if (token) {
      console.error("[API] Failed to fetch technicians from backend:", err);
      return [];
    }
    console.warn("[API] Backend unavailable — using mock technicians data");
    return mockTechnicians;
  }
}

export async function saveTechnician(input: Technician): Promise<Technician> { 
  const token = typeof window !== 'undefined' ? localStorage.getItem('fieldflow-token') : null;
  try {
    if (input.id && !input.id.startsWith("new-")) {
      return await apiRequest<Technician>(`/api/technicians/${input.id}/`, {
        method: 'PATCH',
        body: JSON.stringify(input)
      });
    }
    return await apiRequest<Technician>("/api/technicians/", {
      method: 'POST',
      body: JSON.stringify({
        ...input,
        id: input.id && !input.id.startsWith("new-") ? input.id : `t${Date.now()}`
      })
    });
  } catch (err) {
    if (token) {
      throw err;
    }
    // Mock save for unauthenticated demo
    const newTech = { ...input, id: input.id && !input.id.startsWith("new-") ? input.id : `t${Date.now()}` };
    if (input.id && !input.id.startsWith("new-")) {
      const idx = mockTechnicians.findIndex(t => t.id === input.id);
      if (idx !== -1) { mockTechnicians[idx] = newTech; return newTech; }
    }
    mockTechnicians.push(newTech);
    return newTech;
  }
}
