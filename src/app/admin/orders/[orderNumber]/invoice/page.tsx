import Link from "next/link";
import { ArrowLeft, FileText } from "lucide-react";
import { notFound } from "next/navigation";
import { getAdminInvoiceAction } from "@/actions/invoice";
import { PrintInvoiceButton } from "@/components/store/print-invoice-button";
import { InvoiceDocument } from "@/components/store/invoice-document";
import { PageContainer } from "@/components/layout/page-container";

export const dynamic = "force-dynamic";

export default async function AdminInvoicePage({
  params,
}: {
  params: Promise<{ orderNumber: string }>;
}) {
  const { orderNumber } = await params;
  const result = await getAdminInvoiceAction(orderNumber);

  if (!result.success) {
    if (result.code === "NOT_FOUND") notFound();

    return (
      <PageContainer
        title="Invoice"
        description="Invoice availability and tax documentation."
        actions={
          <Link
            href="/admin/orders"
            className="inline-flex items-center text-sm font-semibold text-amber-700 hover:underline dark:text-amber-400"
          >
            <ArrowLeft className="mr-1.5 h-4 w-4" />
            Orders
          </Link>
        }
      >
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950/20 dark:text-amber-200">
          <div className="flex items-start gap-3">
            <FileText className="mt-0.5 h-5 w-5 shrink-0" />
            <div>
              <p className="font-semibold">Invoice is not available yet</p>
              <p className="mt-1">{result.error}</p>
            </div>
          </div>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer
      title={result.invoice.documentType === "TAX_INVOICE" ? "Tax Invoice" : "Sales Receipt"}
      description={result.invoice.invoiceNumber}
      actions={
        <div className="flex flex-wrap items-center gap-2 print:hidden">
          <Link
            href="/admin/orders"
            className="inline-flex items-center text-sm font-semibold text-amber-700 hover:underline dark:text-amber-400"
          >
            <ArrowLeft className="mr-1.5 h-4 w-4" />
            Orders
          </Link>
          <PrintInvoiceButton />
        </div>
      }
    >
      <InvoiceDocument invoice={result.invoice} />
    </PageContainer>
  );
}
