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
export const STORE_PHONE_DISPLAY = "۰۹۳ ۱۱۴ ۷۸ ۹۷";
export const STORE_PHONE_TEL = "tel:+989131147897";
export const BANK_CARD_NUMBER = "6037-9918-0000-0000";
export const BANK_ACCOUNT_OWNER = "منصور اخوان هریفی (فروشگاه نقشیران)";
