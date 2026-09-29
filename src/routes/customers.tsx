import { createFileRoute } from "@tanstack/react-router";
import { CustomersPage } from "@/features/customers/customers-page";
import { PageLoader } from "@/components/shared/page-loader";
export const Route = createFileRoute("/customers")({head:()=>({meta:[{title:"Customers | FieldFlow"},{name:"description",content:"Manage customer details and service history."},{property:"og:title",content:"Customers | FieldFlow"},{property:"og:description",content:"Manage customer details and service history."},{property:"og:type",content:"website"},{name:"twitter:card",content:"summary_large_image"}]}),pendingComponent:PageLoader,component:()=><CustomersPage />});
