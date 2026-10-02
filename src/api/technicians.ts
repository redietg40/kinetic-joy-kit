import { apiRequest } from "./client"; 
import type { Technician } from "@/types";

export async function listTechnicians() { 
  return apiRequest<Technician[]>("/api/technicians/"); 
}

export async function saveTechnician(input: Technician) { 
  if (input.id && !input.id.startsWith("new-")) {
    return apiRequest<Technician>(`/api/technicians/${input.id}/`, {
      method: 'PATCH',
      body: JSON.stringify(input)
    });
  }
  return apiRequest<Technician>("/api/technicians/", {
    method: 'POST',
    body: JSON.stringify({
      ...input,
      id: input.id && !input.id.startsWith("new-") ? input.id : `t${Date.now()}`
    })
  });
}
