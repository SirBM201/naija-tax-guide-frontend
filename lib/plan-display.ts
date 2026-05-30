export function isFreeLikePlan(planValue?: unknown): boolean {
  const value = String(planValue ?? "").trim().toLowerCase();

  return (
    value === "" ||
    value === "free" ||
    value === "free plan" ||
    value === "no plan" ||
    value === "none" ||
    value === "null" ||
    value === "undefined"
  );
}

export function isInvalidExpiryDate(value?: unknown): boolean {
  if (value === null || value === undefined) return true;

  const raw = String(value).trim();
  if (!raw) return true;

  if (
    raw === "0" ||
    raw === "0000-00-00" ||
    raw.startsWith("1970-01-01") ||
    raw.includes("1 January 1970") ||
    raw.includes("January 1, 1970")
  ) {
    return true;
  }

  const date = new Date(raw);

  if (Number.isNaN(date.getTime())) return true;

  // Anything around Unix epoch should not be treated as a real subscription expiry.
  if (date.getFullYear() <= 1971) return true;

  return false;
}

export function formatPlanExpiry(
  expiryValue?: unknown,
  planValue?: unknown,
  fallback = "Not applicable"
): string {
  if (isFreeLikePlan(planValue)) return fallback;
  if (isInvalidExpiryDate(expiryValue)) return fallback;

  return new Date(String(expiryValue)).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function formatPlanName(planValue?: unknown): string {
  const raw = String(planValue ?? "").trim();

  if (!raw || isFreeLikePlan(raw)) return "Free";

  return raw
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}
