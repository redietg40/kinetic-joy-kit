import { createFileRoute } from "@tanstack/react-router";
import { TechniciansPage } from "@/features/technicians/technicians-page";
import { PageLoader } from "@/components/shared/page-loader";
export const Route = createFileRoute("/technicians")({head:()=>({meta:[{title:"Technicians | FieldFlow"},{name:"description",content:"Monitor technician availability and assignments."},{property:"og:title",content:"Technicians | FieldFlow"},{property:"og:description",content:"Monitor technician availability and assignments."},{property:"og:type",content:"website"},{name:"twitter:card",content:"summary_large_image"}]}),pendingComponent:PageLoader,component:()=><TechniciansPage />});
