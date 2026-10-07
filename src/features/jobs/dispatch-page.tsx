import { useState } from "react";
import { useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, GripVertical, MapPin } from "lucide-react";
import { addDays, format, startOfWeek } from "date-fns";
import { toast } from "sonner";
import { listJobs, updateJob } from "@/api/jobs";
import { listTechnicians } from "@/api/technicians";
import { AppShell } from "@/components/layout/app-shell";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";

export function DispatchPage() {
  const qc = useQueryClient();
  const { data: jobs } = useSuspenseQuery({ queryKey: ["jobs"], queryFn: listJobs });
  const { data: techs } = useSuspenseQuery({ queryKey: ["technicians"], queryFn: listTechnicians });
  
  const [offset, setOffset] = useState(0);
  const week = addDays(startOfWeek(new Date(), { weekStartsOn: 1 }), offset * 7);
  const days = Array.from({ length: 5 }, (_, i) => addDays(week, i));

  const drop = async (jobId: string, technician_id: string, date: Date) => {
    const old = jobs.find(j => j.id === jobId);
    if (!old) return;
    const d = new Date(date);
    d.setHours(new Date(old.scheduled_at).getHours(), 0, 0, 0);
    await updateJob(jobId, { technician_id, scheduled_at: d.toISOString() });
    void qc.invalidateQueries({ queryKey: ["jobs"] });
    toast.success("Dispatch schedule updated");
  };

  // Get today's jobs for the map
  const todaysJobs = jobs.filter(j => 
    new Date(j.scheduled_at).toDateString() === new Date().toDateString() &&
    j.status !== "cancelled"
  );

  // Helper to pseudo-randomly place pins based on ID so they don't jump around
  const getCoordinates = (id: string) => {
    let hash = 0;
    for (let i = 0; i < id.length; i++) {
      hash = id.charCodeAt(i) + ((hash << 5) - hash);
    }
    // Random % between 15 and 85 to keep it away from edges
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
          <Button size="icon" variant="ghost" onClick={() => setOffset(o => o - 1)}>
            <ChevronLeft />
          </Button>
          <strong>{format(week, "MMM d")} – {format(addDays(week, 4), "MMM d")}</strong>
          <Button size="icon" variant="ghost" onClick={() => setOffset(o => o + 1)}>
            <ChevronRight />
          </Button>
        </div>
      }
    >
      <div className="flex flex-col gap-6 page-enter">
        {/* Map Panel */}
        <div className="panel p-0 overflow-hidden relative bg-slate-900 border border-slate-800 rounded-2xl h-[300px]">
          {/* Map Grid Background */}
          <div className="absolute inset-0 opacity-20" style={{
            backgroundImage: 'linear-gradient(var(--primary) 1px, transparent 1px), linear-gradient(90deg, var(--primary) 1px, transparent 1px)',
            backgroundSize: '40px 40px',
            backgroundPosition: 'center center'
          }} />
          
          <div className="absolute top-4 left-4 bg-slate-900/80 backdrop-blur border border-slate-700 px-4 py-2 rounded-lg z-10 shadow-lg">
            <h3 className="font-semibold flex items-center gap-2">
              <MapPin className="w-4 h-4 text-primary" />
              Live Map: Addis Ababa
            </h3>
            <p className="text-xs text-slate-400">{todaysJobs.length} active jobs today</p>
          </div>

          {/* Render Job Pins */}
          {todaysJobs.map(job => {
            const { top, left } = getCoordinates(job.id);
            const tech = techs.find(t => t.id === job.technician_id);
            
            return (
              <div 
                key={job.id} 
                className="absolute transform -translate-x-1/2 -translate-y-1/2 group cursor-pointer"
                style={{ top, left }}
              >
                {/* Pulse ring */}
                <div className="absolute inset-0 bg-primary/40 rounded-full animate-ping" style={{ transform: 'scale(1.5)' }} />
                
                {/* Pin */}
                <div className="relative w-8 h-8 bg-slate-900 border-2 border-primary rounded-full flex items-center justify-center shadow-lg shadow-primary/20 z-10 text-xs font-bold text-primary">
                  {tech?.name?.charAt(0) || '?'}
                </div>
                
                {/* Tooltip */}
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max bg-slate-800 text-white text-xs py-1 px-3 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20 shadow-xl border border-slate-700">
                  <p className="font-semibold">{job.title}</p>
                  <p className="text-slate-300">Assignee: {tech?.name || 'Unassigned'}</p>
                  <p className="text-slate-300">{format(new Date(job.scheduled_at), "h:mm a")}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Dispatch Board */}
        <div className="panel overflow-x-auto p-0 border border-slate-800 rounded-2xl">
          <div className="dispatch-board min-w-[800px]">
            <div className="dispatch-header">
              <div>Technician</div>
              {days.map(d => (
                <div key={d.toISOString()}>
                  <strong>{format(d, "EEE")}</strong>
                  <span>{format(d, "d")}</span>
                </div>
              ))}
            </div>
            
            {techs.map(tech => (
              <div className="dispatch-row" key={tech.id}>
                <div className="dispatch-tech">
                  <span className="avatar">{tech.name.slice(0, 2).toUpperCase()}</span>
                  <strong>{tech.name}</strong>
                  <small>{tech.specialty}</small>
                </div>
                
                {days.map(day => (
                  <div 
                    className="dispatch-cell" 
                    key={day.toISOString()} 
                    onDragOver={e => e.preventDefault()} 
                    onDrop={e => void drop(e.dataTransfer.getData("job"), tech.id, day)}
                  >
                    {jobs.filter(j => 
                      j.technician_id === tech.id && 
                      new Date(j.scheduled_at).toDateString() === day.toDateString() && 
                      j.status !== "cancelled"
                    ).map(job => (
                      <div 
                        draggable 
                        onDragStart={e => e.dataTransfer.setData("job", job.id)} 
                        className={`dispatch-job priority-${job.priority}`} 
                        key={job.id}
                      >
                        <GripVertical className="w-4 h-4" />
                        <strong>{format(new Date(job.scheduled_at), "h:mm a")}</strong>
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
    </AppShell>
  );
}
