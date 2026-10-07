import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import { BarChart3, BriefcaseBusiness, CalendarDays, ChevronLeft, CircleDollarSign, LogOut, Menu, Moon, Settings, Sun, Users, Wrench, X, MessageSquare, Box } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { getSession, logout } from "@/api/auth";
import { initials } from "@/lib/format";

export function AppShell({children,title,description,actions}:{children:ReactNode;title:string;description:string;actions?:ReactNode}){
  const navigate=useNavigate(); const location=useLocation(); const [collapsed,setCollapsed]=useState(false); const [mobile,setMobile]=useState(false); const [dark,setDark]=useState(true); const [ready,setReady]=useState(false); const [user,setUser]=useState(getSession());
  useEffect(()=>{
    const session=getSession(); 
    setUser(session); 
    setReady(true); 
    if(!session) {
      void navigate({to:"/login",search:{expired:undefined}});
    } else if (session.role === 'Technician' && location.pathname === '/') {
      void navigate({to:"/jobs"});
    }
  },[navigate, location.pathname]);
  useEffect(()=>{document.documentElement.classList.toggle("dark",dark)},[dark]);
  
  if(!ready||!user) return <div className="brand-loader"><div className="loader-mark"><span/><span/><span/></div><p>Preparing your workspace</p></div>;
  const doLogout=async()=>{await logout(); void navigate({to:"/login",search:{expired:undefined}})};
  
  let nav=[{to:"/",label:"Overview",icon:BarChart3},{to:"/jobs",label:"Jobs",icon:BriefcaseBusiness},{to:"/dispatch",label:"Dispatch",icon:CalendarDays},{to:"/customers",label:"Customers",icon:Users},{to:"/technicians",label:"Technicians",icon:Wrench},{to:"/invoices",label:"Invoices",icon:CircleDollarSign},{to:"/inventory",label:"Inventory",icon:Box},{to:"/messages",label:"Messages",icon:MessageSquare},{to:"/settings",label:"Settings",icon:Settings}] as const;
  
  if (user.role === 'Technician') {
    // @ts-ignore - TS thinks nav is strictly the tuple above
    nav = [{to:"/jobs",label:"My Jobs",icon:BriefcaseBusiness},{to:"/messages",label:"Messages",icon:MessageSquare}];
  }
  
  return (
    <TooltipProvider>
      <div className="min-h-screen bg-background text-foreground relative overflow-hidden">
        {/* Cinematic Backgrounds */}
        <div className="noise" aria-hidden="true"/>
        <div className="ambient ambient-one" style={{ width: '42vw', height: '28vw', left: '-10vw', top: '20%', background: 'color-mix(in oklab, var(--primary) 15%, transparent)', position: 'fixed', borderRadius: '50%', filter: 'blur(90px)', pointerEvents: 'none', zIndex: 0 }} />
        <div className="ambient ambient-two" style={{ width: '34vw', height: '32vw', right: '-10vw', bottom: '4%', background: 'color-mix(in oklab, var(--accent) 12%, transparent)', position: 'fixed', borderRadius: '50%', filter: 'blur(90px)', pointerEvents: 'none', zIndex: 0 }} />
        <div style={{ position: 'fixed', inset: 0, zIndex: 0, opacity: 0.1, backgroundImage: 'linear-gradient(var(--border) 1px, transparent 1px), linear-gradient(90deg, var(--border) 1px, transparent 1px)', backgroundSize: '72px 72px', maskImage: 'linear-gradient(to bottom, transparent, black 30%, transparent 90%)', pointerEvents: 'none' }} />

        <aside className={`sidebar ${collapsed?"sidebar-collapsed":""} ${mobile?"sidebar-mobile-open":""} relative z-40`}>
          <div className="flex h-16 items-center gap-3 border-b border-sidebar-border px-4">
            <div className="brand-icon"><Wrench/></div>
            {!collapsed&&<div><strong className="block text-base">FieldFlow</strong><span className="text-xs text-sidebar-foreground/60">Operations</span></div>}
            <Button variant="ghost" size="icon" className="ml-auto md:hidden" onClick={()=>setMobile(false)} aria-label="Close navigation"><X/></Button>
          </div>
          <nav className="flex-1 space-y-1 p-3">
            {nav.map(item=>{
              const Icon=item.icon; const active=item.to==="/"?location.pathname===item.to:location.pathname.startsWith(item.to); 
              return (
                <Tooltip key={item.to}>
                  <TooltipTrigger asChild>
                    <Link to={item.to} onClick={()=>setMobile(false)} className={`nav-item ${active?"nav-item-active":""}`}><Icon/><span className={collapsed?"md:hidden":""}>{item.label}</span></Link>
                  </TooltipTrigger>
                  {collapsed&&<TooltipContent side="right">{item.label}</TooltipContent>}
                </Tooltip>
              )
            })}
          </nav>
          <div className="border-t border-sidebar-border p-3">
            <div className="user-chip">
              <span className="avatar">{initials(user.name)}</span>
              {!collapsed&&<span className="min-w-0 flex-1"><strong className="block truncate text-sm">{user.name}</strong><small className="text-sidebar-foreground/60">{user.role}</small></span>}
              <Button variant="ghost" size="icon" onClick={doLogout} aria-label="Log out"><LogOut/></Button>
            </div>
          </div>
        </aside>

        <div className={`app-content ${collapsed?"app-content-collapsed":""} relative z-10`}>
          <header className="topbar">
            <Button variant="ghost" size="icon" className="md:hidden" onClick={()=>setMobile(true)} aria-label="Open navigation"><Menu/></Button>
            <Button variant="ghost" size="icon" className="hidden md:inline-flex" onClick={()=>setCollapsed(!collapsed)} aria-label="Collapse navigation"><ChevronLeft className={collapsed?"rotate-180":""}/></Button>
            <div className="ml-auto flex items-center gap-2">
              <span className="live-dot"/>
              <span className="hidden text-xs text-muted-foreground sm:inline">All systems operational</span>
              <Button variant="ghost" size="icon" onClick={()=>setDark(!dark)} aria-label="Toggle theme">{dark?<Sun/>:<Moon/>}</Button>
            </div>
          </header>
          <main className="p-4 sm:p-6 lg:p-8">
            <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="eyebrow">FIELD OPERATIONS</p>
                <h1 className="page-title">{title}</h1>
                <p className="mt-1 text-sm text-muted-foreground">{description}</p>
              </div>
              {actions}
            </div>
            {children}
          </main>
        </div>
        {mobile&&<button className="mobile-overlay z-35" onClick={()=>setMobile(false)} aria-label="Close navigation"/>}
      </div>
    </TooltipProvider>
  )
}
