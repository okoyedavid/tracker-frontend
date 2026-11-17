export type ReviewedFields = { vendor: string; date: string; total: number };
export const MAX_BYTES = 10 * 1024 * 1024;
export const SUPPORTED_EXTENSIONS = ["jpg", "jpeg", "png", "webp", "heic", "heif"] as const;
const SUPPORTED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"] as const;

function extensionOf(fileName: string) {
  return fileName.split(".").pop()?.toLowerCase() ?? "";
}

export function isSupportedImage(file: File) {
  return SUPPORTED_EXTENSIONS.includes(extensionOf(file.name) as (typeof SUPPORTED_EXTENSIONS)[number]) &&
    (file.type === "" || SUPPORTED_MIME_TYPES.includes(file.type.toLowerCase() as (typeof SUPPORTED_MIME_TYPES)[number]));
}

export function validIsoDate(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return false;
  const [, year, month, day] = match.map(Number);
  const date = new Date(year, month - 1, day);
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;
}

export function normalizeExtractedDate(value: string | null) {
  if (!value) return "";
  const iso = /^(\d{4})-(\d{2})-(\d{2})(?:$|T)/.exec(value.trim());
  if (iso) {
    const normalized = `${iso[1]}-${iso[2]}-${iso[3]}`;
    return validIsoDate(normalized) ? normalized : "";
  }
  const numeric = /^(\d{1,2})[/. -](\d{1,2})[/. -](\d{4})$/.exec(value.trim());
  if (!numeric) return "";
  const first = Number(numeric[1]);
  const second = Number(numeric[2]);
  const year = Number(numeric[3]);
  // Default ambiguous dates to day/month/year. A component above 12 makes
  // the ordering unambiguous, including common US month/day dates.
  const month = first > 12 ? second : second > 12 ? first : second;
  const day = first > 12 ? first : second > 12 ? second : first;
  const normalized = `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  return validIsoDate(normalized) ? normalized : "";
}

export function confidenceTone(value: number | null) {
  if (value === null) return "text-text-tertiary";
  if (value >= 90) return "text-state-success-text";
  if (value >= 70) return "text-text-secondary";
  return "text-text-error-primary";
}

