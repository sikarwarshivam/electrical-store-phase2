/**
 * Parse an admin-form money input such as "1499", "1499.50" or "0.99"
 * into integer paise without relying on floating point arithmetic.
 */
export function parseMoneyToPaise(value: string): number {
  const normalized = value.trim().replace(/,/g, "");

  if (!/^\d+(?:\.\d{1,2})?$/.test(normalized)) {
    throw new Error("Enter a valid amount with up to two decimal places.");
  }

  const [rupeesPart, paisePart = ""] = normalized.split(".");
  const paise = Number((paisePart + "00").slice(0, 2));
  const rupees = Number(rupeesPart);

  if (!Number.isSafeInteger(rupees) || rupees < 0) {
    throw new Error("Amount is too large.");
  }

  const totalPaise = rupees * 100 + paise;

  if (!Number.isSafeInteger(totalPaise)) {
    throw new Error("Amount is too large.");
  }

  return totalPaise;
}

export function formatINRFromPaise(paise: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(paise / 100);
}
