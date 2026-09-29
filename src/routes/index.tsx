import { createFileRoute } from "@tanstack/react-router";
import { DashboardPage } from "@/features/dashboard/dashboard-page";
import { PageLoader } from "@/components/shared/page-loader";
export const Route = createFileRoute("/")({head:()=>({meta:[{title:"Dashboard | FieldFlow"},{name:"description",content:"Live job, team, and revenue overview for FieldFlow dispatchers."},{property:"og:title",content:"Dashboard | FieldFlow"},{property:"og:description",content:"Live job, team, and revenue overview for FieldFlow dispatchers."},{property:"og:type",content:"website"},{name:"twitter:card",content:"summary_large_image"}]}),pendingComponent:PageLoader,component:()=><DashboardPage />});
