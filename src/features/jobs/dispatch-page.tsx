import { useState } from "react";
import { useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, GripVertical, MapPin, Wrench, Calendar, UserCheck } from "lucide-react";
import { addDays, format, startOfWeek } from "date-fns";
import { toast } from "sonner";
import { listJobs, updateJob } from "@/api/jobs";
import { listTechnicians } from "@/api/technicians";
import { listCustomers } from "@/api/customers";
import { AppShell } from "@/components/layout/app-shell";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import type { Job } from "@/types";

export function DispatchPage() {
  const qc = useQueryClient();
  const { data: jobs } = useSuspenseQuery({
    queryKey: ["jobs"],
    queryFn: listJobs,
    refetchInterval: 3000,
  });
  const { data: techs } = useSuspenseQuery({
    queryKey: ["technicians"],
    queryFn: listTechnicians,
    refetchInterval: 5000,
  });
  const { data: customers } = useSuspenseQuery({
    queryKey: ["customers"],
    queryFn: listCustomers,
    refetchInterval: 3000,
  });

  const [offset, setOffset] = useState(0);
  const week = addDays(startOfWeek(new Date(), { weekStartsOn: 1 }), offset * 7);
  const days = Array.from({ length: 5 }, (_, i) => addDays(week, i));

  // Quick Schedule Dialog state
  const [assigningJob, setAssigningJob] = useState<Job | null>(null);
  const [selectedTech, setSelectedTech] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const drop = async (jobId: string, technician_id: string, date: Date) => {
    const old = jobs.find((j) => j.id === jobId);
    if (!old) return;
    const d = new Date(date);
    const existingHours =
      old.scheduled_at && !isNaN(new Date(old.scheduled_at).getTime())
        ? new Date(old.scheduled_at).getHours()
        : 9;
    d.setHours(existingHours, 0, 0, 0);
    await updateJob(jobId, { technician_id, scheduled_at: d.toISOString(), status: "scheduled" });
    void qc.invalidateQueries({ queryKey: ["jobs"] });
    toast.success("Job dispatched and scheduled!");
  };

  const handleManualAssign = async () => {
    if (!assigningJob || !selectedTech || !selectedDate) {
      toast.error("Please pick a technician and date/time");
      return;
    }
    setIsSubmitting(true);
    try {
      await updateJob(assigningJob.id, {
        technician_id: selectedTech,
        scheduled_at: new Date(selectedDate).toISOString(),
        status: "scheduled",
      });
      void qc.invalidateQueries({ queryKey: ["jobs"] });
      toast.success("Job successfully scheduled & technician assigned!");
      setAssigningJob(null);
    } catch {
      toast.error("Failed to assign job");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Unassigned or newly booked jobs awaiting dispatch
  const unassignedJobs = jobs.filter(
    (j) =>
      !j.technician_id ||
      !j.scheduled_at ||
      j.status === "pending" ||
      j.status === "awaiting_payment"
  );

  // Today's scheduled jobs for the live map
  const todaysJobs = jobs.filter((j) => {
    if (!j.scheduled_at || j.status === "cancelled") return false;
    const d = new Date(j.scheduled_at);
    return !isNaN(d.getTime()) && d.toDateString() === new Date().toDateString();
  });

  const getCoordinates = (id: string) => {
    let hash = 0;
    for (let i = 0; i < id.length; i++) {
      hash = id.charCodeAt(i) + ((hash << 5) - hash);
    }
    const top = 15 + Math.abs(hash % 70);
    const left = 15 + Math.abs((hash >> 4) % 70);
    return { top: `${top}%`, left: `${left}%` };
  };

  return (
    <AppShell
      title="Dispatch Board & Map"
      description="Plan technician work and track active jobs across Addis Ababa."
      actions={
        <div className="week-switcher">
          <Button size="icon" variant="ghost" onClick={() => setOffset((o) => o - 1)}>
            <ChevronLeft />
          </Button>
          <strong>
            {format(week, "MMM d")} – {format(addDays(week, 4), "MMM d")}
          </strong>
          <Button size="icon" variant="ghost" onClick={() => setOffset((o) => o + 1)}>
            <ChevronRight />
          </Button>
        </div>
      }
    >
      <div className="flex flex-col gap-6 page-enter">
        {/* Unassigned / Incoming Service Requests Queue */}
        <div className="panel p-5 bg-card border border-border rounded-2xl">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Wrench className="w-5 h-5 text-primary" />
              <h2 className="text-base font-bold">Incoming Customer Requests & Unassigned Jobs</h2>
              <span className="text-xs bg-primary/10 text-primary font-bold px-2 py-0.5 rounded-full">
                {unassignedJobs.length} Pending
              </span>
            </div>
            <span className="text-xs text-muted-foreground hidden sm:inline">
              Drag cards directly into a technician column or click Schedule
            </span>
          </div>

          {unassignedJobs.length === 0 ? (
            <div className="p-4 text-center text-xs text-muted-foreground bg-muted/40 rounded-xl">
              All customer service requests are currently dispatched!
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {unassignedJobs.map((job) => {
                const customer = customers.find((c) => c.id === job.customer_id);
                return (
                  <div
                    key={job.id}
                    draggable
                    onDragStart={(e) => e.dataTransfer.setData("job", job.id)}
                    className="p-3 bg-muted/50 hover:bg-muted border border-border rounded-xl cursor-grab active:cursor-grabbing transition-colors space-y-2"
                  >
                    <div className="flex justify-between items-start gap-1">
                      <strong className="text-xs font-semibold block truncate" title={job.title}>
                        {job.title}
                      </strong>
                      <StatusBadge status={job.status} />
                    </div>
                    <div className="text-[11px] text-muted-foreground space-y-0.5">
                      <p className="truncate">👤 {customer?.name || "Direct Customer"}</p>
                      <p className="truncate">📍 {job.address || customer?.address || "Addis Ababa"}</p>
                      <p className="font-medium text-foreground/80">🔧 {job.service_type}</p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full h-7 text-xs"
                      onClick={() => {
                        setAssigningJob(job);
                        setSelectedTech(techs[0]?.id || "");
                        setSelectedDate(new Date().toISOString().slice(0, 16));
                      }}
                    >
                      <Calendar className="w-3 h-3 mr-1" /> Schedule & Assign
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Map Panel */}
        <div
          className="panel p-0 overflow-hidden relative bg-slate-900 border border-slate-800 rounded-2xl"
          style={{ minHeight: "260px" }}
        >
          <div
            className="absolute inset-0 opacity-20"
            style={{
              backgroundImage:
                "linear-gradient(var(--primary) 1px, transparent 1px), linear-gradient(90deg, var(--primary) 1px, transparent 1px)",
              backgroundSize: "40px 40px",
              backgroundPosition: "center center",
            }}
          />

          <div className="absolute top-4 left-4 bg-slate-900/80 backdrop-blur border border-slate-700 px-4 py-2 rounded-lg z-10 shadow-lg">
            <h3 className="font-semibold flex items-center gap-2">
              <MapPin className="w-4 h-4 text-primary" />
              Live Map: Addis Ababa
            </h3>
            <p className="text-xs text-slate-400">{todaysJobs.length} active scheduled jobs today</p>
          </div>

          {todaysJobs.map((job) => {
            const { top, left } = getCoordinates(job.id);
            const tech = techs.find((t) => t.id === job.technician_id);

            return (
              <div
                key={job.id}
                className="absolute transform -translate-x-1/2 -translate-y-1/2 group cursor-pointer"
                style={{ top, left }}
              >
                <div
                  className="absolute inset-0 bg-primary/40 rounded-full animate-ping"
                  style={{ transform: "scale(1.5)" }}
                />
                <div className="relative w-8 h-8 bg-slate-900 border-2 border-primary rounded-full flex items-center justify-center shadow-lg shadow-primary/20 z-10 text-xs font-bold text-primary">
                  {tech?.name?.charAt(0) || "?"}
                </div>
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max bg-slate-800 text-white text-xs py-1 px-3 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20 shadow-xl border border-slate-700">
                  <p className="font-semibold">{job.title}</p>
                  <p className="text-slate-300">Assignee: {tech?.name || "Unassigned"}</p>
                  <p className="text-slate-300">
                    {job.scheduled_at ? format(new Date(job.scheduled_at), "h:mm a") : "TBD"}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Dispatch Board Calendar Grid */}
        <div className="panel overflow-x-auto p-0 border border-slate-800 rounded-2xl">
          <div className="dispatch-board min-w-[800px]">
            <div className="dispatch-header">
              <div>Technician</div>
              {days.map((d) => (
                <div key={d.toISOString()}>
                  <strong>{format(d, "EEE")}</strong>
                  <span>{format(d, "d")}</span>
                </div>
              ))}
            </div>

            {techs.map((tech) => (
              <div className="dispatch-row" key={tech.id}>
                <div className="dispatch-tech">
                  <span className="avatar">{tech.name.slice(0, 2).toUpperCase()}</span>
                  <strong>{tech.name}</strong>
                  <small>{tech.specialty}</small>
                </div>

                {days.map((day) => (
                  <div
                    className="dispatch-cell"
                    key={day.toISOString()}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => void drop(e.dataTransfer.getData("job"), tech.id, day)}
                  >
                    {jobs
                      .filter((j) => {
                        if (j.technician_id !== tech.id || !j.scheduled_at || j.status === "cancelled")
                          return false;
                        const d = new Date(j.scheduled_at);
                        return !isNaN(d.getTime()) && d.toDateString() === day.toDateString();
                      })
                      .map((job) => (
                        <div
                          draggable
                          onDragStart={(e) => e.dataTransfer.setData("job", job.id)}
                          className={`dispatch-job priority-${job.priority}`}
                          key={job.id}
                        >
                          <GripVertical className="w-4 h-4" />
                          <strong>
                            {job.scheduled_at ? format(new Date(job.scheduled_at), "h:mm a") : "TBD"}
                          </strong>
                          <span className="truncate">{job.title}</span>
                          <StatusBadge status={job.status} />
                        </div>
                      ))}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Manual Quick-Assign Dialog */}
      <Dialog open={!!assigningJob} onOpenChange={(open) => !open && setAssigningJob(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-primary" />
              Assign & Schedule Service Request
            </DialogTitle>
          </DialogHeader>
          {assigningJob && (
            <div className="space-y-4 py-2">
              <div className="p-3 bg-muted rounded-lg text-sm space-y-1">
                <p>
                  <strong>Request:</strong> {assigningJob.title}
                </p>
                <p className="text-muted-foreground">
                  <strong>Service:</strong> {assigningJob.service_type}
                </p>
                <p className="text-muted-foreground">
                  <strong>Location:</strong> {assigningJob.address}
                </p>
              </div>

              <div className="space-y-1.5">
                <Label>Choose Technician</Label>
                <Select value={selectedTech} onValueChange={setSelectedTech}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select technician" />
                  </SelectTrigger>
                  <SelectContent>
                    {techs.map((t) => (
                      <SelectItem key={t.id} value={t.id}>
                        {t.name} ({t.specialty}) - {t.status}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label>Scheduled Date & Time</Label>
                <Input
                  type="datetime-local"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setAssigningJob(null)}>
              Cancel
            </Button>
            <Button onClick={handleManualAssign} disabled={isSubmitting}>
              {isSubmitting ? "Assigning..." : "Confirm & Dispatch"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
