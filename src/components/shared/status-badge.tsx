import { Badge } from "@/components/ui/badge";
import type { InvoiceStatus, JobPriority, JobStatus, TechnicianStatus } from "@/types";
const labels:Record<string,string>={in_progress:"In progress",off_duty:"Off duty",on_job:"On job",scheduled:"Scheduled",completed:"Completed",cancelled:"Cancelled",available:"Available",draft:"Draft",sent:"Sent",paid:"Paid",overdue:"Overdue",urgent:"Urgent",normal:"Normal",low:"Low"};
export function StatusBadge({status}:{status:JobStatus|TechnicianStatus|InvoiceStatus|JobPriority}){return <Badge className={`status-badge status-${status}`}>{labels[status]}</Badge>}
