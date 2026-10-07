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
import { CheckCircle2, ChevronRight, MapPin, Receipt, Wrench, Plus, CalendarClock } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useForm } from "react-hook-form";
import { API_BASE_URL } from "@/api/client";
import { Textarea } from "@/components/ui/textarea";
import { useTranslation } from "@/lib/i18n";

export function CustomerPortal() {
  const { t, language, setLanguage } = useTranslation();
  const [email, setEmail] = useState("");
  const [activeEmail, setActiveEmail] = useState("");

  const { data: customers } = useQuery({ queryKey: ["customers"], queryFn: listCustomers });
  const { data: jobs, refetch: refetchJobs } = useQuery({ queryKey: ["jobs"], queryFn: listJobs, enabled: !!activeEmail });
  const { data: invoices } = useQuery({ queryKey: ["invoices"], queryFn: listInvoices, enabled: !!activeEmail });

  const [bookingOpen, setBookingOpen] = useState(false);
  const [bookingSubmitting, setBookingSubmitting] = useState(false);
  const bookingForm = useForm();

  const customer = customers?.find(c => c.email.toLowerCase() === activeEmail.toLowerCase());
  const customerJobs = jobs?.filter(j => j.customer_id === customer?.id) || [];
  const customerInvoices = invoices?.filter(i => i.customer_id === customer?.id) || [];

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) setActiveEmail(email);
  };

  const handleBookService = async (data: any) => {
    if (!customer) return;
    setBookingSubmitting(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/book/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          name: customer.name, 
          email: customer.email, 
          phone: customer.phone || "000000", 
          address: customer.address || "Addis Ababa",
          title: data.title,
          description: data.description,
          service_type: "General" 
        })
      });
      const resData = await res.json();
      if (resData.checkout_url) {
        window.location.href = resData.checkout_url;
      } else {
        setBookingOpen(false);
        bookingForm.reset();
        refetchJobs();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setBookingSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 overflow-hidden relative">
      {/* Top-Right Language Switcher */}
      <div className="absolute top-4 right-6 z-50 flex gap-2 bg-white/10 backdrop-blur-md p-1 rounded-lg border border-white/20 shadow-sm">
        <button 
          className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${language === 'en' ? 'bg-blue-600 text-white' : 'text-slate-300 hover:text-white'}`}
          onClick={() => setLanguage('en')}
        >
          EN
        </button>
        <button 
          className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${language === 'am' ? 'bg-blue-600 text-white' : 'text-slate-300 hover:text-white'}`}
          onClick={() => setLanguage('am')}
        >
          አማ
        </button>
      </div>

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
              <div className="flex gap-4">
                <Dialog open={bookingOpen} onOpenChange={setBookingOpen}>
                  <DialogTrigger asChild>
                    <Button className="bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20">
                      <Plus className="w-4 h-4 mr-2" /> Book New Service
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Book a New Service</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={bookingForm.handleSubmit(handleBookService)} className="space-y-4 pt-4">
                      <div>
                        <Label>What do you need help with?</Label>
                        <Input {...bookingForm.register("title", { required: true })} placeholder="e.g. Broken AC unit, Leaking pipe" className="mt-1" />
                      </div>
                      <div>
                        <Label>Detailed Description (Optional)</Label>
                        <Textarea {...bookingForm.register("description")} placeholder="Provide any additional details for the technician..." className="mt-1" />
                      </div>
                      <Button type="submit" className="w-full" disabled={bookingSubmitting}>
                        {bookingSubmitting ? "Processing..." : "Submit & Pay Booking Fee"}
                      </Button>
                    </form>
                  </DialogContent>
                </Dialog>
                <Button variant="outline" onClick={() => setActiveEmail("")}>Sign Out</Button>
              </div>
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
