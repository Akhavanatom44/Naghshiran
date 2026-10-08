export function faNum(value: number | string): string {
  return Number(value).toLocaleString("fa-IR");
}

export function formatToman(amount: number): string {
  return amount.toLocaleString("fa-IR") + " تومان";
}

export const STORE_NAME = "نقشیران";
export const STORE_OWNER = "منصور اخوان هریفی";
export const STORE_ADDRESS =
  "اصفهان، خیابان استانداری، نبش خیابان فرشادی، فروشگاه نقشیران";
export const STORE_PHONE_DISPLAY = "۰۹۱۳ ۱۱۴ ۷۸۹۷";
export const STORE_PHONE_TEL = "tel:+989131147897";
