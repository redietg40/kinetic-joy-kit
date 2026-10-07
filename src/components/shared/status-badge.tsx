import { Badge } from "@/components/ui/badge";
import type { InvoiceStatus, JobPriority, JobStatus, TechnicianStatus } from "@/types";
import { useTranslation } from "@/lib/i18n";

export function StatusBadge({status}:{status:JobStatus|TechnicianStatus|InvoiceStatus|JobPriority}) {
  const { t } = useTranslation();
  // @ts-ignore
  return <Badge className={`status-badge status-${status}`}>{t(status)}</Badge>;
}
