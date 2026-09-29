import { createFileRoute } from "@tanstack/react-router";
import { DispatchPage } from "@/features/jobs/dispatch-page";
import { PageLoader } from "@/components/shared/page-loader";
export const Route = createFileRoute("/dispatch")({head:()=>({meta:[{title:"Dispatch Board | FieldFlow"},{name:"description",content:"Plan and adjust technician work across the week."},{property:"og:title",content:"Dispatch Board | FieldFlow"},{property:"og:description",content:"Plan and adjust technician work across the week."},{property:"og:type",content:"website"},{name:"twitter:card",content:"summary_large_image"}]}),pendingComponent:PageLoader,component:()=><DispatchPage />});
