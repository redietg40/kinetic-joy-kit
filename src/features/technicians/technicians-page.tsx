import { useState } from "react";
import { useSuspenseQuery, useMutation, useQueryClient } from "@tanstack/react-query"; 
import { CalendarClock, Mail, Phone, Plus } from "lucide-react"; 
import { toast } from "sonner"; 
import { listTechnicians, saveTechnician } from "@/api/technicians"; 
import { listJobs } from "@/api/jobs"; 
import { AppShell } from "@/components/layout/app-shell"; 
import { StatusBadge } from "@/components/shared/status-badge"; 
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function TechniciansPage() {
  const qc = useQueryClient();
  const { data: techs } = useSuspenseQuery({ queryKey: ["technicians"], queryFn: listTechnicians });
  const { data: jobs } = useSuspenseQuery({ queryKey: ["jobs"], queryFn: listJobs });
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({ name: "", email: "", phone: "", specialty: "General", status: "offline" as const });

  const mutation = useMutation({
    mutationFn: saveTechnician,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["technicians"] });
      setOpen(false);
      toast.success("Technician added successfully!");
      setFormData({ name: "", email: "", phone: "", specialty: "General", status: "offline" });
    },
    onError: () => {
      toast.error("Failed to add technician.");
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email) return toast.error("Name and Email are required");
    mutation.mutate({ ...formData, id: `new-${Date.now()}` });
  };

  return (
    <AppShell 
      title="Technicians" 
      description="See availability, specialties, and today’s workload." 
      actions={
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="mr-2 h-4 w-4" /> Add technician</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Technician</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label>Full Name</Label>
                <Input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required placeholder="John Doe" />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} required type="email" placeholder="john@fieldflow.et" />
              </div>
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} placeholder="+251..." />
              </div>
              <div className="space-y-2">
                <Label>Specialty</Label>
                <Input value={formData.specialty} onChange={e => setFormData({...formData, specialty: e.target.value})} placeholder="e.g. Electrical, HVAC, General" />
              </div>
              <Button type="submit" className="w-full" disabled={mutation.isPending}>
                {mutation.isPending ? "Saving..." : "Save Technician"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      }
    >
      <div className="page-enter card-grid">
        {techs.map(t => {
          const assigned = jobs.filter(j => j.technician_id === t.id && new Date(j.scheduled_at).toDateString() === new Date().toDateString());
          return (
            <article className="technician-card" key={t.id}>
              <div className="flex items-start justify-between">
                <span className="avatar avatar-xl">{t.name.slice(0,2).toUpperCase()}</span>
                <StatusBadge status={t.status}/>
              </div>
              <h2>{t.name}</h2>
              <p className="specialty">{t.specialty} specialist</p>
              <div className="info-list">
                <p><Phone className="w-4 h-4 mr-2 inline" />{t.phone}</p>
                <p><Mail className="w-4 h-4 mr-2 inline" />{t.email}</p>
              </div>
              <div className="assignment-box">
                <span><CalendarClock className="w-4 h-4 inline mr-2" />Today’s assignments</span>
                <strong>{assigned.length}</strong>
                {assigned.slice(0,2).map(j => (
                  <small key={j.id}>{new Date(j.scheduled_at).toLocaleTimeString([],{hour:"numeric",minute:"2-digit"})} · {j.title}</small>
                ))}
              </div>
            </article>
          );
        })}
      </div>
    </AppShell>
  );
}
