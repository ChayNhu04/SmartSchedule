// Format a numeric string into dd/mm/yyyy as the user types.
export function formatDateInput(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 8);
  const dd = digits.slice(0, 2);
  const mm = digits.slice(2, 4);
  const yyyy = digits.slice(4, 8);
  if (digits.length <= 2) return dd;
  if (digits.length <= 4) return `${dd}/${mm}`;
  return `${dd}/${mm}/${yyyy}`;
}

// Format a numeric string into HH:mm as the user types.
export function formatTimeInput(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 4);
  const hh = digits.slice(0, 2);
  const mm = digits.slice(2, 4);
  if (digits.length <= 2) return hh;
  return `${hh}:${mm}`;
}

// Combine "dd/mm/yyyy" + "HH:mm" into an ISO string in the device's local timezone.
// Returns null if either part is missing or invalid.
export function combineDateTime(dateStr: string, timeStr: string): string | null {
  if (!dateStr) return null;
  const dateMatch = dateStr.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!dateMatch) return null;
  const [, ddS, mmS, yyyyS] = dateMatch;
  const dd = Number(ddS);
  const mo = Number(mmS);
  const yyyy = Number(yyyyS);
  if (!dd || !mo || !yyyy) return null;
  if (mo < 1 || mo > 12 || dd < 1 || dd > 31) return null;

  let hh = 0;
  let mi = 0;
  if (timeStr) {
    const timeMatch = timeStr.match(/^(\d{2}):(\d{2})$/);
    if (!timeMatch) return null;
    hh = Number(timeMatch[1]);
    mi = Number(timeMatch[2]);
    if (hh > 23 || mi > 59) return null;
  }

  const d = new Date(yyyy, mo - 1, dd, hh, mi, 0, 0);
  if (Number.isNaN(d.getTime())) return null;
  // Reject things like 31/02 which Date silently rolls over
  if (d.getFullYear() !== yyyy || d.getMonth() !== mo - 1 || d.getDate() !== dd) return null;
  return d.toISOString();
}

// Inverse of combineDateTime: split an ISO string into local "dd/mm/yyyy" + "HH:mm".
export function splitIsoToLocalParts(iso: string | null | undefined): {
  date: string;
  time: string;
} {
  if (!iso) return { date: "", time: "" };
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return { date: "", time: "" };
  const pad = (n: number) => String(n).padStart(2, "0");
  return {
    date: `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`,
    time: `${pad(d.getHours())}:${pad(d.getMinutes())}`,
  };
}
