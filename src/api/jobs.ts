import { delay } from "./client";
import { jobs } from "./mock-data";
import type { Job } from "@/types";
export async function listJobs(){ await delay(); return [...jobs]; } // GET /api/jobs/
export async function getJob(id:string){ await delay(300); return jobs.find(j=>j.id===id) ?? null; } // GET /api/jobs/{id}/
export async function createJob(input:Omit<Job,"id"|"photos"|"completed_at"|"technician_notes"|"status">){ await delay(); const job:Job={...input,id:`J-${1050+jobs.length}`,photos:[],completed_at:null,technician_notes:"",status:"scheduled"}; jobs.unshift(job); return job; } // POST /api/jobs/
export async function updateJob(id:string, patch:Partial<Job>){ await delay(300); const job=jobs.find(j=>j.id===id); if(!job) throw new Error("Job not found"); Object.assign(job,patch); return job; } // PATCH /api/jobs/{id}/ or POST /api/jobs/{id}/assign/
