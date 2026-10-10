import { runtimeEnv } from "@/lib/runtime-env";
// Sends new-order notifications (with the bank receipt photo and an
// inline approve/reject keyboard) to every configured Telegram admin.
// The actual button click is handled by the separate Python Telegram bot,
// which shares the same D1 (SQLite) database and updates the order status
// directly when an admin approves or rejects an order.

type OrderItemLite = {
  productName: string;
  productCode: number;
  unitPrice: number;
  quantity: number;
};

type OrderForTelegram = {
  id: number;
  totalAmount: number;
  fullName: string;
  phone: string;
  deliveryMethod: string;
  address: string | null;
  receiptImage: string; // data URL (base64)
  items: OrderItemLite[];
};

function formatToman(amount: number) {
  return amount.toLocaleString("fa-IR") + " تومان";
}

function dataUrlToBuffer(dataUrl: string): { buffer: Buffer; mime: string } {
  const match = /^data:(.+);base64,(.*)$/.exec(dataUrl);
  if (!match) {
    return { buffer: Buffer.from(dataUrl, "base64"), mime: "image/jpeg" };
  }
  return { buffer: Buffer.from(match[2], "base64"), mime: match[1] };
}

export async function notifyAdminsAboutOrder(order: OrderForTelegram) {
  const token = runtimeEnv("TELEGRAM_BOT_TOKEN");
  const adminIdsRaw = runtimeEnv("TELEGRAM_ADMIN_CHAT_IDS");

  if (!token || !adminIdsRaw) {
    console.warn(
      "[telegram] TELEGRAM_BOT_TOKEN / TELEGRAM_ADMIN_CHAT_IDS not configured, skipping notification",
    );
    return { ok: false as const, reason: "not_configured" };
  }

  const adminIds = adminIdsRaw
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean);

  if (adminIds.length === 0) {
    return { ok: false as const, reason: "no_admins" };
  }

  const itemsText = order.items
    .map(
      (item, idx) =>
        `${idx + 1}. ${item.productName} (کد ${item.productCode}) × ${item.quantity} = ${formatToman(
          item.unitPrice * item.quantity,
        )}`,
    )
    .join("\n");

  const deliveryText =
    order.deliveryMethod === "pickup"
      ? "تحویل حضوری از فروشگاه (اصفهان، خیابان استانداری، نبش خیابان فرشادی، فروشگاه نقشیران)"
      : `ارسال با پیک به آدرس:\n${order.address ?? "-"}`;

  const caption = [
    `🧾 سفارش جدید شماره #${order.id}`,
    "",
    `👤 نام گیرنده: ${order.fullName}`,
    `📱 شماره تماس: ${order.phone}`,
    `🚚 روش تحویل: ${deliveryText}`,
    "",
    "🛒 اقلام سفارش:",
    itemsText,
    "",
    `💰 مبلغ کل قابل پرداخت: ${formatToman(order.totalAmount)}`,
    "",
    "لطفاً فیش واریزی پیوست را بررسی و سفارش را تأیید یا رد کنید.",
  ].join("\n");

  const { buffer, mime } = dataUrlToBuffer(order.receiptImage);
  const ext = mime.includes("png") ? "png" : "jpg";

  const results = await Promise.allSettled(
    adminIds.map(async (chatId) => {
      const formData = new FormData();
      formData.append("chat_id", chatId);
      formData.append("caption", Array.from(caption).slice(0, 1024).join(""));
      formData.append(
        "reply_markup",
        JSON.stringify({
          inline_keyboard: [
            [
              { text: "✅ تأیید سفارش", callback_data: `approve:${order.id}` },
              { text: "❌ رد سفارش", callback_data: `reject:${order.id}` },
            ],
          ],
        }),
      );
      formData.append(
        "photo",
        new Blob([new Uint8Array(buffer)], { type: mime }),
        `receipt-${order.id}.${ext}`,
      );

      const res = await fetch(
        `https://api.telegram.org/bot${token}/sendPhoto`,
        {
          method: "POST",
          body: formData,
          signal: AbortSignal.timeout(8000),
        },
      );

      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Telegram API error: ${res.status} ${text}`);
      }
      return res.json();
    }),
  );

  const anyFailed = results.some((r) => r.status === "rejected");
  results.forEach((r) => {
    if (r.status === "rejected") {
      console.error("[telegram] failed to notify admin:", r.reason);
    }
  });

  return { ok: !anyFailed };
}
