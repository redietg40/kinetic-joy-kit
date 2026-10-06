import { useState } from "react";
import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  CalendarDays,
  Camera,
  CheckCircle2,
  MapPin,
  Phone,
  ReceiptText,
  UserRound,
} from "lucide-react";
import { toast } from "sonner";
import { getJob, updateJob } from "@/api/jobs";
import { listCustomers } from "@/api/customers";
import { listTechnicians } from "@/api/technicians";
import { saveInvoice } from "@/api/invoices";
import { useNavigate } from "@tanstack/react-router";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AppShell } from "@/components/layout/app-shell";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { friendlyDate } from "@/lib/format";
import type { Job } from "@/types";
export function JobDetailPage({ jobId }: { jobId: string }) {
  const qc = useQueryClient();
  const { data: job } = useSuspenseQuery({
    queryKey: ["job", jobId],
    queryFn: () => getJob(jobId),
  });
  const { data: customers } = useSuspenseQuery({ queryKey: ["customers"], queryFn: listCustomers });
  const { data: techs } = useSuspenseQuery({ queryKey: ["technicians"], queryFn: listTechnicians });
  const [open, setOpen] = useState(false);
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [scheduleDate, setScheduleDate] = useState("");
  const [invoiceOpen, setInvoiceOpen] = useState(false);
  const [invoiceAmount, setInvoiceAmount] = useState("");
  const navigate = useNavigate();
  const mutation = useMutation({
    mutationFn: (technician_id: string) => updateJob(jobId, { technician_id }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["job", jobId] });
      setOpen(false);
      toast.success("Technician reassigned");
    },
  });
  const scheduleMutation = useMutation({
    mutationFn: (data: { scheduled_at: string; status: string }) => updateJob(jobId, data),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["job", jobId] });
      setScheduleOpen(false);
      toast.success("Job scheduled! The customer has been notified via email.");
    },
  });
  
  const statusMutation = useMutation({
    mutationFn: (status: string) => updateJob(jobId, { status }),
    onSuccess: (data) => {
      void qc.invalidateQueries({ queryKey: ["job", jobId] });
      toast.success(`Job marked as ${data.status.replace("_", " ")}`);
    },
  });
  
  const invoiceMutation = useMutation({
    mutationFn: (amount: number) => {
      const depositAmount = job?.booking_fee_paid && job?.booking_fee_amount ? Number(job.booking_fee_amount) : 0;
      const finalTotal = Math.max(0, amount - depositAmount);
      
      const line_items = [
        { description: "Labor & Parts for " + job!.title, qty: 1, unit_price: amount }
      ];
      
      if (depositAmount > 0) {
        line_items.push({ description: "Upfront Booking Deposit (Paid)", qty: 1, unit_price: -depositAmount });
      }

      return saveInvoice({
        id: `new-${Date.now()}`,
        job_id: jobId,
        customer_id: job!.customer_id,
        line_items: line_items,
        subtotal: amount,
        tax: 0,
        total: finalTotal,
        currency: "ETB",
        status: "draft",
        payment_method: "Chapa",
        chapa_tx_ref: `tx-${Date.now()}`,
        issued_at: new Date().toISOString(),
        paid_at: null,
        commission_amount: amount * 0.30,
        payout_status: "pending"
      });
    },
    onSuccess: () => {
      setInvoiceOpen(false);
      toast.success("Invoice created successfully!");
      navigate({ to: "/invoices" });
    },
  });
  if (!job)
    return (
      <AppShell title="Job not found" description="This job may have been removed.">
        <Button asChild>
          <Link to="/jobs">Back to jobs</Link>
        </Button>
      </AppShell>
    );
  const customer = customers.find((c) => c.id === job.customer_id);
  const tech = techs.find((t) => t.id === job.technician_id);
  const statuses: Array<Job["status"]> = ["pending", "scheduled", "in_progress", "completed"];
  const progress = Math.max(0, statuses.indexOf(job.status));
  return (
    <AppShell
      title={job.title}
      description={`${job.id} · ${job.service_type}`}
      actions={
        <Button variant="outline" asChild>
          <Link to="/jobs">
            <ArrowLeft />
            All jobs
          </Link>
        </Button>
      }
    >
      <div className="page-enter grid gap-6 xl:grid-cols-[1.5fr_1fr]">
        <div className="space-y-6">
          <section className="panel">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex gap-2">
                <StatusBadge status={job.status} />
                <StatusBadge status={job.priority} />
                {job.booking_fee_paid && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">
                    <CheckCircle2 className="w-3 h-3 mr-1" />
                    Deposit Paid
                  </span>
                )}
              </div>
              <div className="flex gap-2">
                <Dialog open={scheduleOpen} onOpenChange={setScheduleOpen}>
                  <DialogTrigger asChild>
                    <Button variant="secondary">
                      <CalendarDays />
                      Schedule & Notify
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Schedule Repair</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <p className="text-sm text-muted-foreground">
                        Set a date and time for this repair. The customer will automatically receive
                        an email (and Telegram if provided) notification.
                      </p>
                      <input
                        type="datetime-local"
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                        value={scheduleDate}
                        onChange={(e) => setScheduleDate(e.target.value)}
                      />
                      <Button
                        onClick={() =>
                          scheduleMutation.mutate({
                            scheduled_at: new Date(scheduleDate).toISOString(),
                            status: "scheduled",
                          })
                        }
                      >
                        Confirm & Notify
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
                <Dialog open={invoiceOpen} onOpenChange={setInvoiceOpen}>
                  <DialogTrigger asChild>
                    <Button disabled={job.status !== "completed"}>
                      <ReceiptText className="mr-2 h-4 w-4" />
                      Create invoice
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Create Invoice for {job.title}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label>Total Repair Cost (Birr)</Label>
                        <Input 
                          type="number" 
                          placeholder="e.g. 1500" 
                          value={invoiceAmount} 
                          onChange={(e) => setInvoiceAmount(e.target.value)}
                        />
                      </div>
                      
                      {job.booking_fee_paid && invoiceAmount && (
                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-2 text-sm">
                          <div className="flex justify-between text-slate-500">
                            <span>Subtotal</span>
                            <span>{invoiceAmount} ETB</span>
                          </div>
                          <div className="flex justify-between text-green-600">
                            <span>Minus Deposit (Paid)</span>
                            <span>-{job.booking_fee_amount} ETB</span>
                          </div>
                          <div className="flex justify-between font-bold border-t border-slate-200 pt-2 text-base">
                            <span>Final Due to Technician</span>
                            <span>{Math.max(0, Number(invoiceAmount) - Number(job.booking_fee_amount))} ETB</span>
                          </div>
                        </div>
                      )}

                      <Button 
                        disabled={!invoiceAmount || invoiceMutation.isPending}
                        onClick={() => invoiceMutation.mutate(Number(invoiceAmount))}
                        className="w-full"
                      >
                        {invoiceMutation.isPending ? "Creating..." : "Generate Invoice"}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
                <Select value={job.status} onValueChange={(v) => statusMutation.mutate(v)}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Update status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="scheduled">Scheduled</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="timeline">
              {statuses.map((s, i) => (
                <div key={s} className={`timeline-step ${i <= progress ? "timeline-active" : ""}`}>
                  <span>{i < progress ? <CheckCircle2 /> : i + 1}</span>
                  <p>{s.replace("_", " ")}</p>
                </div>
              ))}
            </div>
            <div className="info-list">
              <p>
                <CalendarDays />
                {job.scheduled_at ? friendlyDate(job.scheduled_at) : "Not scheduled yet"}
              </p>
              <p>
                <MapPin />
                {job.address}
              </p>
            </div>
            <h3 className="section-title">Description</h3>
            <p className="text-sm leading-6 text-muted-foreground">{job.description}</p>
            <h3 className="section-title">Technician notes</h3>
            <div className="note-box">
              {job.technician_notes || "No notes have been added yet."}
            </div>
          </section>
          <section className="panel">
            <div className="panel-heading">
              <div>
                <h2>Field photos</h2>
                <p>Photos uploaded from the technician app</p>
              </div>
            </div>
            <div className="empty-state">
              <Camera />
              <strong>No field photos yet</strong>
              <p>Photos appear here when the technician uploads them.</p>
            </div>
          </section>
        </div>
        <aside className="space-y-6">
          <section className="panel">
            <h2 className="mb-5 font-semibold">Customer</h2>
            <div className="contact-card">
              <span className="avatar avatar-lg">{customer?.name.slice(0, 2).toUpperCase()}</span>
              <div>
                <strong>{customer?.name}</strong>
                <p>{customer?.email}</p>
              </div>
            </div>
            <div className="info-list mt-5">
              <p>
                <Phone />
                {customer?.phone}
              </p>
              <p>
                <MapPin />
                {customer?.address}
              </p>
              {customer?.telegram_username && (
                <p className="text-blue-500 font-medium">💬 {customer.telegram_username}</p>
              )}
            </div>
          </section>
          <section className="panel">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold">Assigned technician</h2>
              <Dialog open={open} onOpenChange={setOpen}>
                <DialogTrigger asChild>
                  <Button variant="ghost" size="sm">
                    Reassign
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Reassign job</DialogTitle>
                  </DialogHeader>
                  <Select onValueChange={(v) => mutation.mutate(v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a technician" />
                    </SelectTrigger>
                    <SelectContent>
                      {techs.map((t) => (
                        <SelectItem key={t.id} value={t.id}>
                          {t.name} · {t.specialty}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </DialogContent>
              </Dialog>
            </div>
            <div className="contact-card mt-5">
              <span className="avatar avatar-lg">
                <UserRound />
              </span>
              <div>
                <strong>{tech?.name ?? "Unassigned"}</strong>
                <p>{tech?.specialty}</p>
              </div>
            </div>
          </section>
        </aside>
      </div>
    </AppShell>
  );
}
