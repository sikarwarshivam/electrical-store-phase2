import { formatINRFromPaise } from "@/lib/money";
import type { IOrderInvoice } from "@/models/Order";

function dateText(value: Date | string) {
  return new Date(value).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function addressLines(address: {
  house?: string;
  street?: string;
  landmark?: string;
  city: string;
  state: string;
  pincode?: string;
}) {
  return [
    address.house,
    address.street,
    address.landmark,
    address.city + ", " + address.state,
    address.pincode,
  ].filter(Boolean);
}

export function InvoiceDocument({ invoice }: { invoice: IOrderInvoice }) {
  const cgstPaise = invoice.lines.reduce((sum, line) => sum + line.cgstPaise, 0);
  const sgstPaise = invoice.lines.reduce((sum, line) => sum + line.sgstPaise, 0);
  const igstPaise = invoice.lines.reduce((sum, line) => sum + line.igstPaise, 0);

  return (
    <div className="invoice-sheet mx-auto max-w-5xl bg-white p-6 text-neutral-900 shadow-sm print:max-w-none print:p-0 print:shadow-none">
      <div className="flex items-start justify-between gap-6 border-b border-neutral-300 pb-5">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-neutral-500">
            {invoice.documentType === "TAX_INVOICE" ? "Tax Invoice" : "Sales Receipt"}
          </p>
          <h1 className="mt-2 text-2xl font-bold">{invoice.supplier.tradeName || invoice.supplier.legalName}</h1>
          {invoice.supplier.tradeName && invoice.supplier.tradeName !== invoice.supplier.legalName ? (
            <p className="mt-0.5 text-sm text-neutral-600">{invoice.supplier.legalName}</p>
          ) : null}
          <div className="mt-3 space-y-0.5 text-sm text-neutral-600">
            {addressLines({
              house: undefined,
              street: invoice.supplier.addressLine1,
              landmark: invoice.supplier.addressLine2,
              city: invoice.supplier.city,
              state: invoice.supplier.state,
              pincode: undefined,
            }).map((line) => (
              <p key={line}>{line}</p>
            ))}
            {invoice.supplier.gstin ? <p>GSTIN: {invoice.supplier.gstin}</p> : null}
            {invoice.supplier.phone ? <p>Phone: {invoice.supplier.phone}</p> : null}
            {invoice.supplier.email ? <p>Email: {invoice.supplier.email}</p> : null}
          </div>
        </div>

        <div className="text-right text-sm">
          <p><span className="text-neutral-500">Invoice No.</span> <span className="font-semibold">{invoice.invoiceNumber}</span></p>
          <p className="mt-1"><span className="text-neutral-500">Invoice date</span> <span className="font-semibold">{dateText(invoice.issuedAt)}</span></p>
          <p className="mt-1"><span className="text-neutral-500">Financial year</span> <span className="font-semibold">{invoice.financialYear}</span></p>
          <p className="mt-1"><span className="text-neutral-500">Place of supply</span> <span className="font-semibold">{invoice.placeOfSupply.state}{invoice.placeOfSupply.stateCode ? " (" + invoice.placeOfSupply.stateCode + ")" : ""}</span></p>
        </div>
      </div>

      <div className="mt-5 grid gap-5 md:grid-cols-2">
        <section className="rounded-lg border border-neutral-200 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Bill to</p>
          <p className="mt-2 text-sm font-semibold">{invoice.buyer.name}</p>
          {invoice.buyer.gstin ? <p className="mt-1 text-xs text-neutral-600">GSTIN: {invoice.buyer.gstin}</p> : null}
          <p className="mt-1 text-xs text-neutral-600">{invoice.buyer.phone}</p>
          {invoice.buyer.email ? <p className="text-xs text-neutral-600">{invoice.buyer.email}</p> : null}
          <div className="mt-2 space-y-0.5 text-xs text-neutral-600">
            {addressLines(invoice.buyer.address).map((line) => (
              <p key={line}>{line}</p>
            ))}
          </div>
        </section>

        <section className="rounded-lg border border-neutral-200 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Order & delivery</p>
          <p className="mt-2 text-sm"><span className="text-neutral-500">Delivery method:</span> {invoice.deliveryMethod === "SELF_DELIVERY" ? "Local delivery" : "Courier delivery"}</p>
          <p className="mt-1 text-sm"><span className="text-neutral-500">Reverse charge:</span> {invoice.reverseCharge ? "Yes" : "No"}</p>
          <p className="mt-1 text-sm"><span className="text-neutral-500">Delivery charge:</span> {formatINRFromPaise(invoice.shippingPaise)}</p>
        </section>
      </div>

      <div className="mt-6 overflow-hidden rounded-lg border border-neutral-300">
        <table className="w-full border-collapse text-xs">
          <thead>
            <tr className="bg-neutral-100">
              <th className="border-b border-neutral-300 px-2 py-2 text-left">#</th>
              <th className="border-b border-neutral-300 px-2 py-2 text-left">Description</th>
              <th className="border-b border-neutral-300 px-2 py-2 text-left">HSN</th>
              <th className="border-b border-neutral-300 px-2 py-2 text-right">Qty</th>
              <th className="border-b border-neutral-300 px-2 py-2 text-left">Unit</th>
              <th className="border-b border-neutral-300 px-2 py-2 text-right">Rate</th>
              <th className="border-b border-neutral-300 px-2 py-2 text-right">Discount</th>
              <th className="border-b border-neutral-300 px-2 py-2 text-right">Taxable</th>
              <th className="border-b border-neutral-300 px-2 py-2 text-right">GST</th>
              <th className="border-b border-neutral-300 px-2 py-2 text-right">Line total</th>
            </tr>
          </thead>
          <tbody>
            {invoice.lines.map((line, index) => (
              <tr key={line.sku + index}>
                <td className="border-b border-neutral-200 px-2 py-2 align-top">{index + 1}</td>
                <td className="border-b border-neutral-200 px-2 py-2 align-top">
                  <p className="font-medium">{line.productName}</p>
                  {line.variantTitle ? <p className="mt-0.5 text-neutral-500">{line.variantTitle}</p> : null}
                  <p className="mt-0.5 text-neutral-500">SKU: {line.sku}</p>
                </td>
                <td className="border-b border-neutral-200 px-2 py-2 align-top">{line.hsnCode || "—"}</td>
                <td className="border-b border-neutral-200 px-2 py-2 text-right align-top">{line.quantity}</td>
                <td className="border-b border-neutral-200 px-2 py-2 align-top">{line.unitOfSale}</td>
                <td className="border-b border-neutral-200 px-2 py-2 text-right align-top">{formatINRFromPaise(line.unitPricePaise)}</td>
                <td className="border-b border-neutral-200 px-2 py-2 text-right align-top">{formatINRFromPaise(line.discountPaise)}</td>
                <td className="border-b border-neutral-200 px-2 py-2 text-right align-top">{formatINRFromPaise(line.taxablePaise)}</td>
                <td className="border-b border-neutral-200 px-2 py-2 text-right align-top">
                  {line.gstRate !== undefined ? line.gstRate + "%" : "—"}
                  {line.taxPaise > 0 ? (
                    <span className="mt-0.5 block text-neutral-500">{formatINRFromPaise(line.taxPaise)}</span>
                  ) : null}
                </td>
                <td className="border-b border-neutral-200 px-2 py-2 text-right align-top font-semibold">{formatINRFromPaise(line.lineTotalPaise)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-6 grid gap-6 md:grid-cols-[1fr_300px]">
        <div>
          {invoice.taxPaise > 0 ? (
            <div className="rounded-lg border border-neutral-200 p-4 text-sm">
              <p className="font-semibold">Tax breakup</p>
              {igstPaise > 0 ? (
                <div className="mt-2 flex justify-between"><span className="text-neutral-500">IGST</span><span>{formatINRFromPaise(igstPaise)}</span></div>
              ) : (
                <>
                  <div className="mt-2 flex justify-between"><span className="text-neutral-500">CGST</span><span>{formatINRFromPaise(cgstPaise)}</span></div>
                  <div className="mt-1 flex justify-between"><span className="text-neutral-500">SGST</span><span>{formatINRFromPaise(sgstPaise)}</span></div>
                </>
              )}
              <div className="mt-2 flex justify-between border-t border-neutral-200 pt-2 font-semibold">
                <span>Total GST</span><span>{formatINRFromPaise(invoice.taxPaise)}</span>
              </div>
              {invoice.taxIncludedPaise > 0 ? (
                <p className="mt-2 text-xs text-neutral-500">
                  GST included in the displayed product prices: {formatINRFromPaise(invoice.taxIncludedPaise)}
                </p>
              ) : null}
            </div>
          ) : (
            <div className="rounded-lg border border-neutral-200 p-4 text-xs text-neutral-500">
              No GST has been charged on this document.
            </div>
          )}
        </div>

        <div className="rounded-lg border border-neutral-200 p-4 text-sm">
          <div className="flex justify-between"><span className="text-neutral-500">Subtotal</span><span>{formatINRFromPaise(invoice.lines.reduce((sum, line) => sum + line.subtotalPaise, 0))}</span></div>
          <div className="mt-1 flex justify-between"><span className="text-neutral-500">Discounts</span><span>- {formatINRFromPaise(invoice.lines.reduce((sum, line) => sum + line.discountPaise, 0))}</span></div>
          <div className="mt-1 flex justify-between"><span className="text-neutral-500">Delivery</span><span>{formatINRFromPaise(invoice.shippingPaise)}</span></div>
          <div className="mt-1 flex justify-between"><span className="text-neutral-500">GST</span><span>{formatINRFromPaise(invoice.taxPaise)}</span></div>
          <div className="mt-3 flex justify-between border-t border-neutral-300 pt-3 text-base font-bold"><span>Grand total</span><span>{formatINRFromPaise(invoice.grandTotalPaise)}</span></div>
        </div>
      </div>

      <div className="mt-6 border-t border-neutral-200 pt-4 text-xs text-neutral-500">
        <p>Document generated from the recorded order and tax configuration.</p>
        {invoice.documentType === "TAX_INVOICE" ? (
          <p className="mt-1">
            Tax values are based on the GST rate and HSN data configured for the products at order time.
          </p>
        ) : null}
        <p className="mt-1">Reverse charge: {invoice.reverseCharge ? "Applicable" : "Not applicable"}</p>
      </div>
    </div>
  );
}
