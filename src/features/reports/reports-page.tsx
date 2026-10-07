import { useSuspenseQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/layout/app-shell";
import { listJobs } from "@/api/jobs";
import { listInvoices } from "@/api/invoices";
import { listTechnicians } from "@/api/technicians";
import { money } from "@/lib/format";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line
} from "recharts";

const COLORS = ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ef4444'];

export function ReportsPage() {
  const { data: jobs } = useSuspenseQuery({ queryKey: ["jobs"], queryFn: listJobs });
  const { data: invoices } = useSuspenseQuery({ queryKey: ["invoices"], queryFn: listInvoices });
  const { data: techs } = useSuspenseQuery({ queryKey: ["technicians"], queryFn: listTechnicians });

  // 1. Revenue by Month
  const revenueData = [];
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const thisMonth = new Date().getMonth();
  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setMonth(thisMonth - i);
    const m = d.getMonth();
    const invs = invoices.filter(inv => inv.status === "paid" && new Date(inv.issued_at).getMonth() === m);
    revenueData.push({
      name: monthNames[m],
      Revenue: invs.reduce((sum, inv) => sum + Number(inv.total), 0)
    });
  }

  // 2. Technician Performance (Jobs Completed)
  const techData = techs.map(tech => ({
    name: tech.name.split(" ")[0], // First name only for chart
    Completed: jobs.filter(j => j.technician_id === tech.id && j.status === "completed").length,
    Active: jobs.filter(j => j.technician_id === tech.id && j.status === "in_progress").length,
  }));

  // 3. Job Status Distribution
  const statuses = ["pending", "scheduled", "in_progress", "completed", "cancelled"];
  const pieData = statuses.map(s => ({
    name: s.replace("_", " ").toUpperCase(),
    value: jobs.filter(j => j.status === s).length
  })).filter(d => d.value > 0);

  return (
    <AppShell
      title="Analytics & Reports"
      description="Deep dive into revenue, technician performance, and job status."
    >
      <div className="flex flex-col gap-6 page-enter">
        
        {/* Top KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="panel flex flex-col items-center justify-center py-8">
            <p className="text-slate-400 mb-2">Total Revenue (All Time)</p>
            <h2 className="text-4xl font-bold text-emerald-400">
              {money(invoices.filter(i => i.status === "paid").reduce((s, i) => s + Number(i.total), 0))}
            </h2>
          </div>
          <div className="panel flex flex-col items-center justify-center py-8">
            <p className="text-slate-400 mb-2">Total Jobs Completed</p>
            <h2 className="text-4xl font-bold text-primary">
              {jobs.filter(j => j.status === "completed").length}
            </h2>
          </div>
          <div className="panel flex flex-col items-center justify-center py-8">
            <p className="text-slate-400 mb-2">Technician Payouts (Owed)</p>
            <h2 className="text-4xl font-bold text-amber-400">
              {money(invoices.filter(i => i.payout_status === "pending" && i.status === "paid").reduce((s, i) => s + Number(i.commission_amount), 0))}
            </h2>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Revenue Over Time */}
          <div className="panel">
            <div className="panel-heading">
              <div>
                <h2>Revenue History</h2>
                <p>Last 6 months collected revenue</p>
              </div>
            </div>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={revenueData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="name" stroke="var(--muted-foreground)" />
                  <YAxis stroke="var(--muted-foreground)" />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}
                    formatter={(val: number) => money(val)}
                  />
                  <Line type="monotone" dataKey="Revenue" stroke="var(--primary)" strokeWidth={3} dot={{ r: 6 }} activeDot={{ r: 8 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Job Status Distribution */}
          <div className="panel">
            <div className="panel-heading">
              <div>
                <h2>Job Status Distribution</h2>
                <p>Breakdown of all jobs by current status</p>
              </div>
            </div>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }} />
                  <Legend verticalAlign="bottom" height={36}/>
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Technician Performance */}
          <div className="panel lg:col-span-2">
            <div className="panel-heading">
              <div>
                <h2>Technician Performance</h2>
                <p>Jobs completed and currently active per technician</p>
              </div>
            </div>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={techData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="name" stroke="var(--muted-foreground)" />
                  <YAxis stroke="var(--muted-foreground)" />
                  <Tooltip contentStyle={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }} />
                  <Legend />
                  <Bar dataKey="Completed" fill="#10b981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Active" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>
      </div>
    </AppShell>
  );
}
