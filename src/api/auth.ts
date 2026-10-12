import { apiRequest, API_BASE_URL } from "./client"; 
import type { SessionUser } from "@/types";

const KEY="fieldflow-session";
const TOKEN_KEY="fieldflow-token";

export async function login(email:string,password:string) { 
  const res = await fetch(`${API_BASE_URL}/api/auth/login/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: email, password })
  });
  
  if (!res.ok) {
    throw new Error("Check your email and password and try again.");
  }
  
  const data = await res.json();
  localStorage.setItem(TOKEN_KEY, data.access);
  
  const meRes = await fetch(`${API_BASE_URL}/api/auth/me/`, { headers: { 'Authorization': 'Bearer ' + data.access } }); if (!meRes.ok) throw new Error("Unable to fetch user profile."); const meData = await meRes.json(); const user: SessionUser = { id: meData.id.toString(), name: meData.name, email: meData.email, role: meData.role }; 
  localStorage.setItem(KEY, JSON.stringify(user)); 
  return user;
}

export async function register(data: { name: string, email: string, password: string, role: string }) {
  const res = await fetch(`${API_BASE_URL}/api/auth/register/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  
  if (!res.ok) {
    throw new Error("Unable to create account. Email may already be in use.");
  }
  
  // Auto-login after registration
  return login(data.email, data.password);
}

export async function logout() { 
  localStorage.removeItem(KEY);
  localStorage.removeItem(TOKEN_KEY);
}

export function getSession(): SessionUser|null { 
  if(typeof window==="undefined") return null; 
  const value=localStorage.getItem(KEY); 
  try { return value ? JSON.parse(value) as SessionUser : null; } catch { return null; } 
}
