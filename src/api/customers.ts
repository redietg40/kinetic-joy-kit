import { delay } from "./client"; import { customers } from "./mock-data"; import type { Customer } from "@/types";
export async function listCustomers(){ await delay(450); return [...customers]; } // GET /api/customers/
export async function getCustomer(id:string){ await delay(250); return customers.find(c=>c.id===id) ?? null; } // GET /api/customers/{id}/
export async function saveCustomer(input:Omit<Customer,"id"|"created_at"> & {id?:string}){ await delay(); const existing=input.id?customers.find(c=>c.id===input.id):undefined; if(existing){Object.assign(existing,input); return existing;} const customer={...input,id:`c${customers.length+1}`,created_at:new Date().toISOString()}; customers.unshift(customer); return customer;} // POST/PATCH /api/customers/
