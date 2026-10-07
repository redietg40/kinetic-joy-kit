import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { listCustomers } from "@/api/customers";
import { listJobs } from "@/api/jobs";
import { listInvoices } from "@/api/invoices";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { StatusBadge } from "@/components/shared/status-badge";
import { friendlyDate, money } from "@/lib/format";
import { motion } from "framer-motion";
import { CheckCircle2, ChevronRight, MapPin, Receipt, Wrench } from "lucide-react";

export function CustomerPortal() {
  const [email, setEmail] = useState("");
  const [activeEmail, setActiveEmail] = useState("");

  const { data: customers } = useQuery({ queryKey: ["customers"], queryFn: listCustomers });
  const { data: jobs } = useQuery({ queryKey: ["jobs"], queryFn: listJobs, enabled: !!activeEmail });
  const { data: invoices } = useQuery({ queryKey: ["invoices"], queryFn: listInvoices, enabled: !!activeEmail });

  const customer = customers?.find(c => c.email.toLowerCase() === activeEmail.toLowerCase());
  const customerJobs = jobs?.filter(j => j.customer_id === customer?.id) || [];
  const customerInvoices = invoices?.filter(i => i.customer_id === customer?.id) || [];

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) setActiveEmail(email);
  };

  return (
    <main className="min-h-screen bg-slate-50 overflow-hidden relative">
      <div className="absolute top-0 left-0 w-full h-[400px] bg-slate-900 z-0 overflow-hidden">
        <div className="absolute inset-0 bg-[url('/login-bg.png')] bg-cover bg-center opacity-40 mix-blend-overlay" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-slate-50" />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-4 pt-20 pb-12">
        <motion.div 
          className="text-center mb-12"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="w-16 h-16 bg-white rounded-2xl mx-auto flex items-center justify-center mb-6 shadow-xl shadow-black/5">
            <Wrench className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-4">Customer Portal</h1>
          <p className="text-slate-300 text-lg">Track your service requests, view updates, and manage invoices.</p>
        </motion.div>

        {!activeEmail || !customer ? (
          <motion.div 
            className="max-w-md mx-auto bg-white p-8 rounded-3xl shadow-2xl border border-slate-100"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <form onSubmit={handleLogin} className="space-y-6">
              <div>
                <Label>Enter your email address</Label>
                <Input 
                  type="email" 
                  required 
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="e.g. you@example.com"
                  className="mt-2 h-12"
                />
              </div>
              <Button type="submit" size="lg" className="w-full">
                View My Portal <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            </form>
            {activeEmail && !customer && (
              <p className="text-red-500 text-sm mt-4 text-center">No customer found with that email address.</p>
            )}
          </motion.div>
        ) : (
          <motion.div 
            className="space-y-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="bg-white p-8 rounded-3xl shadow-xl border border-slate-100 flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">Welcome back, {customer.name}!</h2>
                <p className="text-slate-500">{customer.address}</p>
              </div>
              <Button variant="outline" onClick={() => setActiveEmail("")}>Sign Out</Button>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              {/* Jobs Column */}
              <section className="space-y-4">
                <h3 className="text-xl font-bold flex items-center gap-2">
                  <Wrench className="w-5 h-5 text-primary" /> Your Service Jobs
                </h3>
                {customerJobs.length === 0 ? (
                  <div className="bg-white p-6 rounded-2xl border border-slate-100 text-center text-slate-500">
                    You have no service requests on file.
                  </div>
                ) : (
                  customerJobs.map(job => (
                    <motion.div key={job.id} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <strong className="block text-lg">{job.title}</strong>
                          <span className="text-sm text-slate-500 flex items-center gap-1 mt-1"><MapPin className="w-4 h-4"/> {job.address}</span>
                        </div>
                        <StatusBadge status={job.status} />
                      </div>
                      
                      <div className="bg-slate-50 p-4 rounded-xl mb-4">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Scheduled For</span>
                        <p className="font-medium">{friendlyDate(job.scheduled_at)}</p>
                      </div>

                      {job.technician_notes && (
                        <div className="bg-blue-50 text-blue-900 p-4 rounded-xl border border-blue-100 flex gap-3">
                          <CheckCircle2 className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
                          <div>
                            <span className="text-xs font-bold text-blue-500 uppercase tracking-wider block mb-1">Technician Update</span>
                            <p className="text-sm">{job.technician_notes}</p>
                          </div>
                        </div>
                      )}
                    </motion.div>
                  ))
                )}
              </section>

              {/* Invoices Column */}
              <section className="space-y-4">
                <h3 className="text-xl font-bold flex items-center gap-2">
                  <Receipt className="w-5 h-5 text-amber-500" /> Your Invoices
                </h3>
                {customerInvoices.length === 0 ? (
                  <div className="bg-white p-6 rounded-2xl border border-slate-100 text-center text-slate-500">
                    You have no invoices on file.
                  </div>
                ) : (
                  customerInvoices.map(invoice => (
                    <motion.div key={invoice.id} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <strong className="block text-lg">Invoice {invoice.id.split("-")[0]}</strong>
                          <span className="text-sm text-slate-500">Issued: {friendlyDate(invoice.issued_at)}</span>
                        </div>
                        <StatusBadge status={invoice.status} />
                      </div>

                      <div className="flex justify-between items-end mt-6 pt-4 border-t border-slate-100">
                        <strong className="text-2xl">{money(invoice.total)}</strong>
                        {invoice.status !== "paid" && (
                          <Button>Pay Online</Button>
                        )}
                      </div>
                    </motion.div>
                  ))
                )}
              </section>
            </div>
          </motion.div>
        )}
      </div>
    </main>
  );
}
