import { createFileRoute } from "@tanstack/react-router";
import { InvoicesPage } from "@/features/invoices/invoices-page";
import { PageLoader } from "@/components/shared/page-loader";
export const Route = createFileRoute("/invoices")({head:()=>({meta:[{title:"Invoices | FieldFlow"},{name:"description",content:"Build and track ETB invoices and Chapa payments."},{property:"og:title",content:"Invoices | FieldFlow"},{property:"og:description",content:"Build and track ETB invoices and Chapa payments."},{property:"og:type",content:"website"},{name:"twitter:card",content:"summary_large_image"}]}),pendingComponent:PageLoader,component:()=><InvoicesPage />});
