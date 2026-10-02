import { apiRequest } from "./client";
import type { Job } from "@/types";

export async function listJobs() { 
  return apiRequest<Job[]>("/api/jobs/"); 
}

export async function getJob(id: string) { 
  return apiRequest<Job>(`/api/jobs/${id}/`); 
}

export async function createJob(input: Omit<Job, "id" | "photos" | "completed_at" | "technician_notes" | "status">) { 
  return apiRequest<Job>("/api/jobs/", {
    method: 'POST',
    body: JSON.stringify({
      ...input,
      id: `J-${Date.now()}`,
      status: "scheduled"
    })
  }); 
}

export async function updateJob(id: string, patch: Partial<Job>) { 
  return apiRequest<Job>(`/api/jobs/${id}/`, {
    method: 'PATCH',
    body: JSON.stringify(patch)
  }); 
}
