import { useEffect, useMemo, useState } from "react";
import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link } from "@tanstack/react-router";
import { ArrowUpDown, CalendarDays, Plus, Search, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { getSession } from "@/api/auth";
import { createJob, listJobs } from "@/api/jobs";
import { listCustomers } from "@/api/customers";
import { listTechnicians } from "@/api/technicians";
import { AppShell } from "@/components/layout/app-shell";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { friendlyDate } from "@/lib/format";
import { useTranslation } from "@/lib/i18n";

const schema = z.object({
  title: z.string().min(3),
  customer_id: z.string().min(1),
  service_type: z.enum(["HVAC", "Plumbing", "Electrical", "General"]),
  scheduled_at: z.string().min(1),
  address: z.string().min(4),
  priority: z.enum(["low", "normal", "urgent"]),
  technician_id: z.string().min(1),
  description: z.string().optional().default(""),
});

type FormData = z.infer<typeof schema>;

const STATUS_OPTIONS = [
  "pending",
  "awaiting_payment",
  "scheduled",
  "in_progress",
  "completed",
  "cancelled",
] as const;

const SERVICE_OPTIONS = ["HVAC", "Plumbing", "Electrical", "General"] as const;

export function JobsPage() {
  const qc = useQueryClient();
  const [isClient, setIsClient] = useState(false);
  useEffect(() => {
    setIsClient(true);
  }, []);
  const { t } = useTranslation();

  const session = getSession();
  const isTech = isClient ? session?.role?.toLowerCase() === "technician" : false;
  const { data: jobs } = useSuspenseQuery({ queryKey: ["jobs"], queryFn: listJobs });
  const { data: customers } = useSuspenseQuery({ queryKey: ["customers"], queryFn: listCustomers });
  const { data: techs } = useSuspenseQuery({ queryKey: ["technicians"], queryFn: listTechnicians });

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [service, setService] = useState("all");
  const [page, setPage] = useState(1);
  const [open, setOpen] = useState(false);
  const currentTech = techs.find((t) => t.email === session?.email);

  const pendingCount = useMemo(() => {
    return jobs.filter((j) => j.status === "pending" || j.status === "awaiting_payment" || !j.technician_id).length;
  }, [jobs]);

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: "",
      customer_id: "",
      service_type: "General",
      scheduled_at: "",
      address: "",
      priority: "normal",
      technician_id: "",
      description: "",
    },
  });

  const mutation = useMutation({
    mutationFn: createJob,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["jobs"] });
      setOpen(false);
      form.reset();
      toast.success("Job scheduled successfully");
    },
  });

  const filtered = useMemo(() => {
    return jobs
      .filter(
        (j) =>
          (status === "all" || j.status === status) &&
          (service === "all" || j.service_type === service) &&
          `${j.id} ${j.title} ${j.address}`.toLowerCase().includes(search.toLowerCase())
      )
      .filter((j) => !isTech || j.technician_id === currentTech?.id);
  }, [jobs, search, status, service, isTech, currentTech]);

  const rows = filtered.slice((page - 1) * 8, page * 8);

  const submit = (data: FormData) => {
    const tech = techs.find((t) => t.id === data.technician_id);
    const conflict = jobs.some(
      (j) =>
        j.technician_id === data.technician_id &&
        j.scheduled_at &&
        Math.abs(new Date(j.scheduled_at).getTime() - new Date(data.scheduled_at).getTime()) < 7200000
    );
    if (conflict) {
      toast.warning(`${tech?.name} has a nearby appointment. Please review the schedule.`);
      return;
    }
    mutation.mutate({ ...data, technician_id: data.technician_id });
  };

  return (
    <AppShell
      title={t("Jobs Title")}
      description={t("Jobs Desc")}
      actions={
        (!isTech && (
          <div className="flex gap-2">
            <Button variant="outline" asChild>
              <Link to="/dispatch">
                <CalendarDays className="w-4 h-4 mr-1.5" />
                {t("Dispatch board")}
              </Link>
            </Button>
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-1.5" />
                  {t("New job")}
                </Button>
              </DialogTrigger>
              <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Schedule a new job</DialogTitle>
                  <DialogDescription>
                    Add service details and assign an available technician.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={form.handleSubmit(submit)} className="form-grid">
                  <FormField label="Job title" error={form.formState.errors.title?.message}>
                    <Input {...form.register("title")} placeholder="e.g. AC inspection" />
                  </FormField>
                  <FormField label="Customer">
                    <Select
                      onValueChange={(v) => {
                        form.setValue("customer_id", v);
                        form.setValue("address", customers.find((c) => c.id === v)?.address ?? "");
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Choose customer" />
                      </SelectTrigger>
                      <SelectContent>
                        {customers.map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormField>
                  <FormField label="Service type">
                    <Select
                      defaultValue="General"
                      onValueChange={(v) => form.setValue("service_type", v as FormData["service_type"])}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {SERVICE_OPTIONS.map((v) => (
                          <SelectItem value={v} key={v}>
                            {v}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormField>
                  <FormField label="Date and time">
                    <Input type="datetime-local" {...form.register("scheduled_at")} />
                  </FormField>
                  <FormField label="Assign technician">
                    <Select onValueChange={(v) => form.setValue("technician_id", v)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Available technicians" />
                      </SelectTrigger>
                      <SelectContent>
                        {techs
                          .filter((t) => t.status === "available")
                          .map((t) => (
                            <SelectItem value={t.id} key={t.id}>
                              {t.name} · {t.specialty}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </FormField>
                  <FormField label="Priority">
                    <Select
                      defaultValue="normal"
                      onValueChange={(v) => form.setValue("priority", v as FormData["priority"])}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {["low", "normal", "urgent"].map((v) => (
                          <SelectItem value={v} key={v}>
                            {v}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormField>
                  <div className="sm:col-span-2">
                    <FormField label="Service address">
                      <Input {...form.register("address")} />
                    </FormField>
                  </div>
                  <DialogFooter className="sm:col-span-2">
                    <Button variant="outline" type="button" onClick={() => setOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={mutation.isPending}>
                      {mutation.isPending ? "Scheduling…" : "Schedule job"}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        )) || <></>
      }
    >
      <div className="page-enter panel overflow-hidden">
        {pendingCount > 0 && !isTech && (
          <div className="mb-4 p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl flex items-center justify-between gap-3 text-amber-900 dark:text-amber-200 text-sm">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                <strong>{pendingCount}</strong> customer service request{pendingCount > 1 ? "s" : ""} awaiting technician assignment & schedule.
              </span>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="border-amber-300 text-amber-900 hover:bg-amber-100"
              onClick={() => {
                setStatus("all");
                setSearch("");
              }}
            >
              View All
            </Button>
          </div>
        )}

        <div className="filters">
          <div className="search-box">
            <Search />
            <Input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder={t("Search jobs")}
            />
          </div>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder={t("All statuses")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("All statuses")}</SelectItem>
              {STATUS_OPTIONS.map((v) => (
                <SelectItem value={v} key={v}>
                  {v.replace("_", " ").toUpperCase()}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={service} onValueChange={setService}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder={t("All services")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("All services")}</SelectItem>
              {SERVICE_OPTIONS.map((v) => (
                <SelectItem value={v} key={v}>
                  {v}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>
                  {t("Job")} <ArrowUpDown className="w-3 h-3 inline ml-1" />
                </th>
                <th>{t("Customer")}</th>
                <th>{t("Service")}</th>
                <th>{t("Schedule")}</th>
                <th>{t("Technician")}</th>
                <th>{t("Status")}</th>
                <th>{t("Priority")}</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-muted-foreground">
                    No jobs found.
                  </td>
                </tr>
              ) : (
                rows.map((j) => (
                  <tr key={j.id}>
                    <td>
                      <Link to="/jobs/$jobId" params={{ jobId: j.id }}>
                        <strong>{j.title}</strong>
                        <small>{j.id}</small>
                      </Link>
                    </td>
                    <td>{customers.find((c) => c.id === j.customer_id)?.name ?? "Direct Booking"}</td>
                    <td>{j.service_type}</td>
                    <td>{friendlyDate(j.scheduled_at)}</td>
                    <td>{techs.find((t) => t.id === j.technician_id)?.name ?? t("Unassigned")}</td>
                    <td>
                      <StatusBadge status={j.status} />
                    </td>
                    <td>
                      <StatusBadge status={j.priority} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="pagination-row">
          <p>
            {t("Showing")} {filtered.length === 0 ? 0 : (page - 1) * 8 + 1}–
            {Math.min(page * 8, filtered.length)} of {filtered.length}
          </p>
          <div>
            <Button
              variant="outline"
              size="sm"
              disabled={page === 1}
              onClick={() => setPage((p) => p - 1)}
            >
              {t("Previous")}
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page * 8 >= filtered.length}
              onClick={() => setPage((p) => p + 1)}
            >
              {t("Next")}
            </Button>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

function FormField({
  label,
  error,
  children,
}: {
  label: string;
  error?: string | undefined;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
