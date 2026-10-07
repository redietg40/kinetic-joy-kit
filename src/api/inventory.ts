import { apiRequest } from "./client";

export interface InventoryItem {
  id: string;
  name: string;
  description: string;
  category: string;
  quantity: number;
  unit: string;
  reorder_level: number;
  unit_cost: number;
}

export interface JobPartUsage {
  id: number;
  job: string;
  item: string;
  quantity_used: number;
  recorded_at: string;
  item_details?: InventoryItem;
}

export async function listInventory(): Promise<InventoryItem[]> {
  return apiRequest<InventoryItem[]>("/api/inventory/");
}

export async function createInventoryItem(data: Partial<InventoryItem>): Promise<InventoryItem> {
  return apiRequest<InventoryItem>("/api/inventory/", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateInventoryItem(id: string, data: Partial<InventoryItem>): Promise<InventoryItem> {
  return apiRequest<InventoryItem>(`/api/inventory/${id}/`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export async function listJobParts(jobId: string): Promise<JobPartUsage[]> {
  const all = await apiRequest<JobPartUsage[]>("/api/job-parts/");
  return all.filter(u => u.job === jobId);
}

export async function useJobPart(data: { job: string; item: string; quantity_used: number }): Promise<JobPartUsage> {
  return apiRequest<JobPartUsage>("/api/job-parts/", {
    method: "POST",
    body: JSON.stringify(data),
  });
}
