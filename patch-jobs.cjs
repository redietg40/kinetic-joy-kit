const fs = require('fs');
let text = fs.readFileSync('src/features/jobs/jobs-page.tsx', 'utf8');

text = text.replace('import { createJob,listJobs } from "@/api/jobs";', 'import { getSession } from "@/api/auth";\nimport { createJob,listJobs } from "@/api/jobs";');

text = text.replace('export function JobsPage(){const qc=useQueryClient();', 'export function JobsPage(){const qc=useQueryClient(); const session = getSession(); const isTech = session?.role === "Technician";');

text = text.replace('const form=useForm<FormData>', 'const currentTech = techs.find((t) => t.email === session?.email);\n const form=useForm<FormData>');

const old_filter = 'const filtered=useMemo(()=>jobs.filter(j=>(status==="all"||j.status===status)&&(service==="all"||j.service_type===service)&&(`${j.id} ${j.title} ${j.address}`.toLowerCase().includes(search.toLowerCase()))),[jobs,search,status,service]);';
const new_filter = 'const filtered=useMemo(()=>jobs.filter(j=>(status==="all"||j.status===status)&&(service==="all"||j.service_type===service)&&(`${j.id} ${j.title} ${j.address}`.toLowerCase().includes(search.toLowerCase()))).filter(j=>!isTech || j.technician_id===currentTech?.id),[jobs,search,status,service,isTech,currentTech]);';
text = text.replace(old_filter, new_filter);

text = text.replace('actions={<div className="flex gap-2">', 'actions={!isTech && <div className="flex gap-2">');
text = text.replace('</DialogContent></Dialog></div>}', '</DialogContent></Dialog></div> || <></>}');

fs.writeFileSync('src/features/jobs/jobs-page.tsx', text);
