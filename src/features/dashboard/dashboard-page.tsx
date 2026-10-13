import { useSuspenseQuery } from "@tanstack/react-query";
import { ArrowUpRight, BriefcaseBusiness, CheckCircle2, CircleDollarSign, Clock3 } from "lucide-react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis } from "recharts";
import { listJobs } from "@/api/jobs"; 
import { listInvoices } from "@/api/invoices"; 
import { listCustomers } from "@/api/customers";
import { listTechnicians } from "@/api/technicians";
import { getSession } from "@/api/auth";
import { AppShell } from "@/components/layout/app-shell"; 
import { StatusBadge } from "@/components/shared/status-badge"; 
import { friendlyDate, money, formatDisplayName } from "@/lib/format";
import { motion } from "framer-motion";

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } },
};

export function DashboardPage() {
  const user = getSession();
  const { data: jobs } = useSuspenseQuery({ queryKey: ["jobs"], queryFn: listJobs });
  const { data: invoices } = useSuspenseQuery({ queryKey: ["invoices"], queryFn: listInvoices });
  const { data: customers } = useSuspenseQuery({ queryKey: ["customers"], queryFn: listCustomers });
  const { data: technicians } = useSuspenseQuery({ queryKey: ["technicians"], queryFn: listTechnicians });
  
  const sameDay = (v: string) => new Date(v).toDateString() === new Date().toDateString();
  const today = jobs.filter(j => sameDay(j.scheduled_at));
  
  const cards = [
    { label: "Jobs today", value: today.length, meta: "Scheduled for today", icon: BriefcaseBusiness, tone: "primary" },
    { label: "In progress", value: jobs.filter(j => j.status === "in_progress").length, meta: "Teams currently active", icon: Clock3, tone: "amber" },
    { label: "Completed this week", value: jobs.filter(j => j.status === "completed").length, meta: "On track for target", icon: CheckCircle2, tone: "green" },
    { label: "Unpaid invoices", value: money(invoices.filter(i => i.status !== "paid").reduce((s, i) => s + Number(i.total), 0)), meta: `${invoices.filter(i => i.status !== "paid").length} invoices outstanding`, icon: CircleDollarSign, tone: "orange" }
  ];

  // Dynamic revenue calculation for the last 7 days
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const todayDate = new Date();
  const revenue = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date(todayDate);
    d.setDate(todayDate.getDate() - (6 - i));
    const dayInvoices = invoices.filter(inv => inv.status === "paid" && new Date(inv.issued_at).toDateString() === d.toDateString());
    const v = dayInvoices.reduce((sum, inv) => sum + Number(inv.total), 0);
    return { d: days[d.getDay()], v };
  });
  
  const totalRevenue = revenue.reduce((sum, r) => sum + r.v, 0);
  
  return (
    <AppShell title={`Good morning, ${formatDisplayName(user?.name)}`} description="Here’s what’s happening across your field operations today.">
      <motion.div 
        className="space-y-6"
        variants={containerVariants}
        initial="hidden"
        animate="show"
      >
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" style={{ perspective: "1000px" }}>
          {cards.map((card, i) => {
            const Icon = card.icon;
            return (
              <motion.article 
                key={card.label} 
                className={`metric-card metric-${card.tone}`}
                variants={itemVariants}
                whileHover={{ 
                  scale: 1.05,
                  rotateX: 5,
                  rotateY: -5,
                  z: 20,
                  boxShadow: "0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)"
                }}
                transition={{ type: "spring", stiffness: 400, damping: 15 }}
                style={{ transformStyle: "preserve-3d" }}
              >
                <div className="metric-icon" style={{ transform: "translateZ(30px)" }}>
                  <Icon />
                </div>
                <p style={{ transform: "translateZ(20px)" }}>{card.label}</p>
                <strong style={{ transform: "translateZ(40px)" }}>{card.value}</strong>
                <span style={{ transform: "translateZ(20px)" }}>
                  <ArrowUpRight /> {card.meta}
                </span>
              </motion.article>
            );
          })}
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.45fr_1fr]">
          <motion.div className="panel" variants={itemVariants}>
            <div className="panel-heading">
              <div>
                <h2>Today’s schedule</h2>
                <p>{today.length} jobs across Addis Ababa</p>
              </div>
              <span className="date-chip">Today</span>
            </div>
            <div className="divide-y divide-border">
              {today.map(job => {
                const customer = customers.find(c => c.id === job.customer_id);
                const tech = technicians.find(t => t.id === job.technician_id);
                return (
                  <motion.div 
                    key={job.id} 
                    className="schedule-row"
                    whileHover={{ x: 10, backgroundColor: "var(--muted)" }}
                    transition={{ type: "spring", stiffness: 400, damping: 25 }}
                  >
                    <time>{new Date(job.scheduled_at).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}</time>
                    <span className={`service-line service-${job.service_type.toLowerCase()}`} />
                    <div className="min-w-0 flex-1">
                      <strong>{job.title}</strong>
                      <p>{customer?.name} · {job.address}</p>
                    </div>
                    <div className="hidden text-right sm:block">
                      <p className="text-sm font-medium">{tech?.name}</p>
                      <StatusBadge status={job.status} />
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>

          <motion.div className="panel" variants={itemVariants}>
            <div className="panel-heading">
              <div>
                <h2>Revenue</h2>
                <p>Collected this week</p>
              </div>
              <strong className="text-xl">{money(totalRevenue)}</strong>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={revenue}>
                  <CartesianGrid vertical={false} stroke="var(--border)" />
                  <XAxis dataKey="d" axisLine={false} tickLine={false} fontSize={12} />
                  <Tooltip cursor={{ fill: "var(--muted)" }} formatter={(v) => money(Number(v))} />
                  <Bar dataKey="v" fill="var(--primary)" radius={[5, 5, 0, 0]} animationDuration={1500} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        </section>

        <motion.section className="panel" variants={itemVariants}>
          <div className="panel-heading">
            <div>
              <h2>Technician Announcements</h2>
              <p>Recent notes and updates from your field team</p>
            </div>
          </div>
          <div className="activity-grid">
            {jobs.filter(j => j.technician_notes).slice(0, 4).map(job => (
              <motion.div 
                key={job.id} 
                className="activity-item"
                whileHover={{ scale: 1.02, x: 8 }}
                transition={{ type: "spring", stiffness: 400, damping: 20 }}
              >
                <span className="activity-dot bg-blue-100 text-blue-600">
                  <CheckCircle2 className="w-4 h-4" />
                </span>
                <div>
                  <p>
                    <strong>{technicians.find(t => t.id === job.technician_id)?.name}</strong>: "{job.technician_notes}"
                  </p>
                  <small>
                    Regarding {job.title} · {friendlyDate(job.completed_at ?? job.scheduled_at)}
                  </small>
                </div>
              </motion.div>
            ))}
            {jobs.filter(j => j.technician_notes).length === 0 && (
              <p className="text-sm text-slate-500">No announcements from technicians yet.</p>
            )}
          </div>
        </motion.section>
      </motion.div>
    </AppShell>
  );
}
