import { delay } from "./client"; import type { SessionUser } from "@/types";
const KEY="fieldflow-session";
export async function login(email:string,password:string){ await delay(700); if(!email.includes("@")||password.length<6) throw new Error("Check your email and password and try again."); const user:SessionUser={id:"u1",name:"Rediet Getahun",email,role:"Owner"}; localStorage.setItem(KEY,JSON.stringify(user)); return user;} // POST /api/auth/login/
export async function logout(){ await delay(200); localStorage.removeItem(KEY);} // POST /api/auth/logout/
export function getSession():SessionUser|null{ if(typeof window==="undefined") return null; const value=localStorage.getItem(KEY); try{return value?JSON.parse(value) as SessionUser:null;}catch{return null;} }
