import { createFileRoute } from "@tanstack/react-router";
import { SettingsPage } from "@/features/settings/settings-page";
import { PageLoader } from "@/components/shared/page-loader";
export const Route = createFileRoute("/settings")({head:()=>({meta:[{title:"Settings | FieldFlow"},{name:"description",content:"Manage FieldFlow company and user preferences."},{property:"og:title",content:"Settings | FieldFlow"},{property:"og:description",content:"Manage FieldFlow company and user preferences."},{property:"og:type",content:"website"},{name:"twitter:card",content:"summary_large_image"}]}),pendingComponent:PageLoader,component:()=><SettingsPage />});
