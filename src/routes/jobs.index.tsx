import { createFileRoute } from "@tanstack/react-router";
import { JobsPage } from "@/features/jobs/jobs-page";
import { PageLoader } from "@/components/shared/page-loader";
export const Route = createFileRoute("/jobs/")({head:()=>({meta:[{title:"Jobs | FieldFlow"},{name:"description",content:"Search, schedule, assign, and track field-service jobs."},{property:"og:title",content:"Jobs | FieldFlow"},{property:"og:description",content:"Search, schedule, assign, and track field-service jobs."},{property:"og:type",content:"website"},{name:"twitter:card",content:"summary_large_image"}]}),pendingComponent:PageLoader,component:()=><JobsPage />});
