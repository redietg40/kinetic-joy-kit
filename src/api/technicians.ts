import { delay } from "./client"; import { technicians } from "./mock-data"; import type { Technician } from "@/types";
export async function listTechnicians(){ await delay(400); return [...technicians]; } // GET /api/technicians/
export async function saveTechnician(input:Technician){ await delay(); const existing=technicians.find(t=>t.id===input.id); if(existing) Object.assign(existing,input); else technicians.unshift(input); return input;} // POST/PATCH /api/technicians/
