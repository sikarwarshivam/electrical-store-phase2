"use client";

import { useState } from "react";
import { trackGuestOrderAction } from "@/actions/customer-orders";
import { Button } from "@/components/ui/button";
import { formatINRFromPaise } from "@/lib/money";

export function TrackOrderForm() {
  const [orderNumber, setOrderNumber] = useState("");
  const [phone, setPhone] = useState("");
  const [result, setResult] = useState<Awaited<ReturnType<typeof trackGuestOrderAction>> | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setResult(null);
    try {
      setResult(await trackGuestOrderAction({ orderNumber, phone }));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
      <form onSubmit={submit} className="rounded-xl border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-950">
        <h2 className="text-base font-bold">Find your order</h2>
        <label className="mt-4 block text-sm font-medium">Order number
          <input value={orderNumber} onChange={(e) => setOrderNumber(e.target.value.toUpperCase())} required placeholder="ELC-20260925-XXXXXXXX" className="mt-1.5 h-10 w-full rounded-md border border-neutral-300 bg-white px-3 text-sm dark:border-neutral-700 dark:bg-neutral-900" />
        </label>
        <label className="mt-4 block text-sm font-medium">Phone
          <input value={phone} onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))} required inputMode="numeric" maxLength={10} placeholder="9876543210" className="mt-1.5 h-10 w-full rounded-md border border-neutral-300 bg-white px-3 text-sm dark:border-neutral-700 dark:bg-neutral-900" />
        </label>
        <Button type="submit" className="mt-5 w-full" isLoading={loading}>Track order</Button>
        {result && !result.success ? <p className="mt-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/20 dark:text-red-200">{result.error}</p> : null}
      </form>

      {result?.success ? (
        <section className="rounded-xl border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-950">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs text-neutral-500">Order</p>
              <h2 className="text-lg font-bold">{result.order.orderNumber}</h2>
            </div>
            <div className="flex gap-2">
              <span className="rounded-full border px-2.5 py-0.5 text-xs font-semibold">{result.order.status.replaceAll("_", " ")}</span>
              <span className="rounded-full border px-2.5 py-0.5 text-xs font-semibold">Payment {result.order.payment.status}</span>
            </div>
          </div>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <div><p className="text-xs text-neutral-500">Total</p><p className="font-bold">{formatINRFromPaise(result.order.pricing.grandTotalPaise)}</p></div>
            <div><p className="text-xs text-neutral-500">Placed</p><p className="font-medium">{new Date(result.order.createdAt).toLocaleString("en-IN")}</p></div>
          </div>
          <div className="mt-5 border-t border-neutral-200 pt-4 dark:border-neutral-800">
            <p className="text-sm font-semibold">Status history</p>
            <div className="mt-3 space-y-3">
              {result.order.statusHistory.map((entry: {status:string; changedAt:string; note?:string}, index:number) => (
                <div key={entry.status + entry.changedAt + index} className="text-sm">
                  <p className="font-medium">{entry.status.replaceAll("_", " ")}</p>
                  <p className="text-xs text-neutral-500">{new Date(entry.changedAt).toLocaleString("en-IN")}{entry.note ? " · " + entry.note : ""}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      ) : null}
    </div>
  );
}
