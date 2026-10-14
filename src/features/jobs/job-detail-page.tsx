import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
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
  Wrench,
} from "lucide-react";
import { toast } from "sonner";
import { getJob, updateJob } from "@/api/jobs";
import { listCustomers } from "@/api/customers";
import { listTechnicians } from "@/api/technicians";
import { listInventory, listJobParts, useJobPart } from "@/api/inventory";
import { saveInvoice } from "@/api/invoices";
import { getSession } from "@/api/auth";
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
  const [isClient, setIsClient] = useState(false);
  useEffect(() => { setIsClient(true); }, []);
  const session = getSession();
  const isTech = isClient ? session?.role?.toLowerCase() === "technician" : false;
  const { data: job } = useSuspenseQuery({
    queryKey: ["job", jobId],
    queryFn: () => getJob(jobId),
  });
  const { data: customers = [] } = useSuspenseQuery({ queryKey: ["customers"], queryFn: listCustomers });
  const { data: techs = [] } = useSuspenseQuery({ queryKey: ["technicians"], queryFn: listTechnicians });
  const { data: inventory = [] } = useQuery({ queryKey: ["inventory"], queryFn: listInventory });
  const { data: jobParts = [] } = useQuery({ queryKey: ["jobParts", jobId], queryFn: () => listJobParts(jobId) });
  
  const [open, setOpen] = useState(false);
  const [partOpen, setPartOpen] = useState(false);
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [scheduleDate, setScheduleDate] = useState("");
  const [invoiceOpen, setInvoiceOpen] = useState(false);
  const [invoiceAmount, setInvoiceAmount] = useState("");
  const [noteText, setNoteText] = useState(job?.technician_notes || "");
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
    mutationFn: (data: { scheduled_at: string; status: Job["status"] }) => updateJob(jobId, data),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["job", jobId] });
      setScheduleOpen(false);
      toast.success("Job scheduled! The customer has been notified via email.");
    },
  });
  
  const statusMutation = useMutation({
    mutationFn: (status: Job["status"]) => updateJob(jobId, { status }),
    onSuccess: (data) => {
      void qc.invalidateQueries({ queryKey: ["job", jobId] });
      toast.success(`Job marked as ${data.status.replace("_", " ")}`);
    },
  });
  
  const noteMutation = useMutation({
    mutationFn: (note: string) => updateJob(jobId, { technician_notes: note }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["job", jobId] });
      toast.success("Announcement sent to owner!");
    }
  });

  const partMutation = useMutation({
    mutationFn: useJobPart,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["jobParts", jobId] });
      void qc.invalidateQueries({ queryKey: ["inventory"] });
      setPartOpen(false);
      toast.success("Part recorded successfully");
    }
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
                {!isTech && (
                  <>
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
                  </>
                )}
                {!isTech && (
                  <Dialog open={invoiceOpen} onOpenChange={setInvoiceOpen}>
                    <DialogTrigger asChild>
                      {job.status === "completed" ? (
                        <Button>
                          <ReceiptText className="mr-2 h-4 w-4" />
                          Create invoice
                        </Button>
                      ) : (
                        <Button 
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            statusMutation.mutate("completed");
                            toast.success("Job marked as completed!");
                          }}
                          className="bg-green-600 hover:bg-green-700 text-white"
                        >
                          <CheckCircle2 className="mr-2 h-4 w-4" />
                          Mark as Completed
                        </Button>
                      )}
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
                )}
                {!isTech && (
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
                )}
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
            <h3 className="section-title">Technician notes (Announcements to Boss)</h3>
            {isTech ? (
              <div className="note-box flex gap-2">
                <textarea 
                  value={noteText}
                  onChange={e => setNoteText(e.target.value)}
                  placeholder="Write an announcement or note for the owner here..."
                  className="flex-1 p-2 text-sm bg-transparent border-none resize-none focus:outline-none min-h-[80px]"
                />
                <Button 
                  onClick={() => noteMutation.mutate(noteText)}
                  disabled={noteMutation.isPending || noteText === job.technician_notes}
                  variant="secondary"
                  size="sm"
                  className="self-end"
                >
                  {noteMutation.isPending ? "Sending..." : "Send Note"}
                </Button>
              </div>
            ) : (
              <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-800">
                {job.technician_notes ? (
                  <p className="text-sm text-slate-300 whitespace-pre-wrap">{job.technician_notes}</p>
                ) : (
                  <p className="text-sm text-slate-500 italic">No announcements from the technician yet.</p>
                )}
              </div>
            )}
          </section>
          <section className="panel">
            <div className="panel-heading">
              <div>
                <h2>Parts Used</h2>
                <p>Track materials and parts consumed on this job</p>
              </div>
              {isTech && job.status !== "completed" && (
                <Dialog open={partOpen} onOpenChange={setPartOpen}>
                  <DialogTrigger asChild>
                    <Button variant="secondary" size="sm">Add Part</Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Record Part Usage</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={e => {
                      e.preventDefault();
                      const fd = new FormData(e.currentTarget);
                      partMutation.mutate({
                        job: jobId,
                        item: fd.get("item") as string,
                        quantity_used: parseInt(fd.get("quantity") as string, 10)
                      });
                    }} className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label>Select Part</Label>
                        <select required name="item" className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-sm">
                          <option value="">-- Choose part --</option>
                          {inventory.filter((i: any) => i.quantity > 0).map((i: any) => (
                            <option key={i.id} value={i.id}>{i.name} ({i.quantity} {i.unit} in stock)</option>
                          ))}
                        </select>
                      </div>
                      <div className="space-y-2">
                        <Label>Quantity Used</Label>
                        <Input required name="quantity" type="number" min="1" defaultValue="1" />
                      </div>
                      <Button type="submit" disabled={partMutation.isPending}>Record Part</Button>
                    </form>
                  </DialogContent>
                </Dialog>
              )}
            </div>
            {jobParts.length === 0 ? (
              <div className="empty-state py-4 border-none">
                <Wrench className="opacity-50" />
                <p>No parts recorded yet.</p>
              </div>
            ) : (
              <div className="mt-4 space-y-2">
                {jobParts.map((jp: any) => (
                  <div key={jp.id} className="flex justify-between items-center bg-slate-900/50 p-3 rounded-lg border border-slate-800">
                    <div>
                      <p className="text-sm font-medium">{jp.item_details?.name || 'Unknown Part'}</p>
                      <p className="text-xs text-slate-500">Recorded {new Date(jp.recorded_at).toLocaleDateString()}</p>
                    </div>
                    <span className="text-sm font-medium">{jp.quantity_used} {jp.item_details?.unit}</span>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
        <aside className="space-y-6">
          <section className="panel">
            <h2 className="mb-5 font-semibold">Customer</h2>
            <div className="contact-card">
              <span className="avatar avatar-lg">{(customer?.name || "Customer").slice(0, 2).toUpperCase()}</span>
              <div>
                <strong>{customer?.name || "Direct Booking Customer"}</strong>
                <p>{customer?.email || "No email on file"}</p>
              </div>
            </div>
            <div className="info-list mt-5">
              <p>
                <Phone />
                {customer?.phone || "No phone provided"}
              </p>
              <p>
                <MapPin />
                {customer?.address || job.address || "No address provided"}
              </p>
              {customer?.telegram_username && (
                <p className="text-blue-500 font-medium">💬 {customer.telegram_username}</p>
              )}
            </div>
          </section>
          <section className="panel">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold">Assigned technician</h2>
              {!isTech && (
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
              )}
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
