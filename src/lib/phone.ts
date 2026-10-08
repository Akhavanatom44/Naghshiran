const persianDigits = "۰۱۲۳۴۵۶۷۸۹";
const arabicDigits = "٠١٢٣٤٥٦٧٨٩";

export function normalizeIranianMobile(input: string): string | null {
  const asciiDigits = input.replace(/[۰-۹٠-٩]/g, (digit) => {
    const persianIndex = persianDigits.indexOf(digit);
    if (persianIndex >= 0) return String(persianIndex);
    return String(arabicDigits.indexOf(digit));
  });

  let digits = asciiDigits.replace(/\D/g, "");
  if (digits.startsWith("0098")) digits = `0${digits.slice(4)}`;
  else if (digits.startsWith("98")) digits = `0${digits.slice(2)}`;
  else if (digits.length === 10 && digits.startsWith("9")) digits = `0${digits}`;

  return /^09\d{9}$/.test(digits) ? digits : null;
}

export function formatIranianMobile(input: string): string {
  const normalized = normalizeIranianMobile(input);
  if (!normalized) return input;
  return `${normalized.slice(0, 4)} ${normalized.slice(4, 7)} ${normalized.slice(7)}`;
}
