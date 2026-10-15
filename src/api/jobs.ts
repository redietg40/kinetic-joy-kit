import { apiRequest } from "./client";
import { jobs as mockJobs } from "./mock-data";
import type { Job } from "@/types";

export async function listJobs(): Promise<Job[]> { 
  const token = typeof window !== 'undefined' ? localStorage.getItem('fieldflow-token') : null;
  try {
    return await apiRequest<Job[]>("/api/jobs/");
  } catch (err) {
    if (token) {
      console.error("[API] Failed to fetch jobs from backend:", err);
      return [];
    }
    console.warn("[API] Backend unavailable — using mock jobs data");
    return mockJobs;
  }
}

export async function getJob(id: string): Promise<Job> { 
  try {
    return await apiRequest<Job>(`/api/jobs/${id}/`);
  } catch {
    const job = mockJobs.find(j => j.id === id);
    if (!job) throw new Error(`Job ${id} not found`);
    return job;
  }
}

export async function createJob(input: Omit<Job, "id" | "photos" | "completed_at" | "technician_notes" | "status">): Promise<Job> { 
  try {
    return await apiRequest<Job>("/api/jobs/", {
      method: 'POST',
      body: JSON.stringify({
        ...input,
        id: `J-${Date.now()}`,
        status: "scheduled"
      })
    });
  } catch {
    // Mock creation: return the input as a new job
    const newJob: Job = {
      ...input,
      id: `J-${Date.now()}`,
      status: "scheduled",
      photos: [],
      completed_at: null,
      technician_notes: "",
    };
    mockJobs.unshift(newJob);
    return newJob;
  }
}

export async function updateJob(id: string, patch: Partial<Job>): Promise<Job> { 
  try {
    return await apiRequest<Job>(`/api/jobs/${id}/`, {
      method: 'PATCH',
      body: JSON.stringify(patch)
    });
  } catch {
    const idx = mockJobs.findIndex(j => j.id === id);
    if (idx === -1) throw new Error(`Job ${id} not found`);
    mockJobs[idx] = { ...mockJobs[idx], ...patch };
    return mockJobs[idx];
  }
}

export async function notifyJobTelegram(jobId: string): Promise<{ status: string; message: string }> {
  return await apiRequest<{ status: string; message: string }>(`/api/jobs/${jobId}/notify_telegram/`, {
    method: 'POST'
  });
}

