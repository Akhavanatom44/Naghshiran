"use client";

import SellerMessages from "./SellerMessages";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  CheckIcon,
  HeadsetIcon,
  MapPinIcon,
  PackageIcon,
  PhoneIcon,
  ReceiptIcon,
  ShieldIcon,
  TruckIcon,
  UserIcon,
} from "@/components/icons";
import { STORE_ADDRESS } from "@/lib/format";
import { faNum, formatToman } from "@/lib/format";

 type OrderItem = {
  id: number;
  productName: string;
  productCode: number;
  unitPrice: number;
  quantity: number;
};

type AdminOrder = {
  id: number;
  userId: number;
  status: string;
  totalAmount: number;
  fullName: string;
  phone: string;
  deliveryMethod: string;
  address: string | null;
  customerNote: string | null;
  adminNote: string | null;
  telegramStatus: string;
  createdAt: string | number | Date;
  updatedAt: string | number | Date;
  username: string | null;
  accountPhone: string | null;
  receiptAvailable?: boolean;
  items: OrderItem[];
  receiptImage?: string;
};

type Filter = "all" | "pending" | "approved" | "rejected";

const statusLabels: Record<string, string> = {
  pending: "در انتظار بررسی",
  approved: "پرداخت تأیید شده",
  rejected: "رد شده",
};

function statusClasses(status: string) {
  if (status === "approved") return "border-emerald-400/40 bg-emerald-400/10 text-emerald-300";
  if (status === "rejected") return "border-rose-400/40 bg-rose-400/10 text-rose-300";
  return "border-amber-400/40 bg-amber-400/10 text-amber-300";
}

function dateLabel(value: string | number | Date) {
  return new Date(value).toLocaleString("fa-IR");
}

export default function AdminDashboard() {
  const router = useRouter();
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [filter, setFilter] = useState<Filter>("all");
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [detail, setDetail] = useState<AdminOrder | null>(null);
  const [adminNote, setAdminNote] = useState("");
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function loadOrders(selectFirst = false) {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/admin/orders", { cache: "no-store" });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error ?? "دریافت سفارش‌ها ناموفق بود");
      const nextOrders = Array.isArray(data.orders) ? data.orders : [];
      setOrders(nextOrders);
      if (selectFirst && nextOrders.length > 0) setSelectedId(nextOrders[0].id);
      if (selectedId !== null && !nextOrders.some((order: AdminOrder) => order.id === selectedId)) {
        setSelectedId(nextOrders[0]?.id ?? null);
      }
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "دریافت سفارش‌ها ناموفق بود");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // This effect is the external API subscription/bootstrap for the dashboard.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadOrders(true);
    // The dashboard intentionally loads once; refresh is an explicit action.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (selectedId === null) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setDetail(null);
      return;
    }
    const controller = new AbortController();
    setDetailLoading(true);
    setError("");
    fetch(`/api/admin/orders/${selectedId}`, {
      cache: "no-store",
      signal: controller.signal,
    })
      .then(async (response) => {
        const data = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(data.error ?? "جزئیات سفارش دریافت نشد");
        if (!controller.signal.aborted) {
          const nextDetail = data.order as AdminOrder;
          setDetail(nextDetail);
          setAdminNote(nextDetail.adminNote ?? "");
        }
      })
      .catch((reason: unknown) => {
        if (!controller.signal.aborted) {
          setDetail(null);
          setError(reason instanceof Error ? reason.message : "جزئیات سفارش دریافت نشد");
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setDetailLoading(false);
      });
    return () => controller.abort();
  }, [selectedId]);

  const counts = useMemo(
    () => ({
      all: orders.length,
      pending: orders.filter((order) => order.status === "pending").length,
      approved: orders.filter((order) => order.status === "approved").length,
      rejected: orders.filter((order) => order.status === "rejected").length,
    }),
    [orders],
  );

  const visibleOrders = useMemo(
    () => (filter === "all" ? orders : orders.filter((order) => order.status === filter)),
    [orders, filter],
  );

  async function updateOrder(patch: { status?: string; adminNote?: string | null }) {
    if (!detail || saving) return;
    setSaving(true);
    setError("");
    setMessage("");
    try {
      const response = await fetch("/api/admin/orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: detail.id, ...patch }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error ?? "ذخیره سفارش ناموفق بود");
      const nextStatus = data.order?.status ?? patch.status ?? detail.status;
      const nextNote = data.order?.adminNote ?? (patch.adminNote === undefined ? detail.adminNote : patch.adminNote);
      setDetail((current) => current ? { ...current, status: nextStatus, adminNote: nextNote } : current);
      setOrders((current) => current.map((order) => order.id === detail.id
        ? { ...order, status: nextStatus, adminNote: nextNote }
        : order));
      setAdminNote(nextNote ?? "");
      setMessage(nextStatus === "approved" ? "پرداخت سفارش تأیید شد" : nextStatus === "rejected" ? "سفارش رد شد و موجودی آزاد شد" : "یادداشت ذخیره شد");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "ذخیره سفارش ناموفق بود");
    } finally {
      setSaving(false);
    }
  }

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" }).catch(() => undefined);
    router.replace("/admin");
    router.refresh();
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="mb-1 flex items-center gap-2 text-xs font-bold text-teal-200">
            <ShieldIcon className="h-4 w-4" />
            دسترسی فروشنده
          </p>
          <h1 className="text-2xl font-black text-white sm:text-3xl">
            پنل <span className="gradient-text">مدیریت نقشیران</span>
          </h1>
          <p className="mt-1.5 text-sm text-[var(--muted)]">
            خریداران، فیش‌های واریزی، محصولات سفارش‌داده‌شده و روش تحویل را بررسی کنید.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => void loadOrders()}
            disabled={loading}
            className="btn-outline rounded-xl px-4 py-2.5 text-xs disabled:opacity-50"
          >
            {loading ? "در حال دریافت..." : "به‌روزرسانی سفارش‌ها"}
          </button>
          <button
            type="button"
            onClick={() => void logout()}
            className="rounded-xl border border-rose-400/30 bg-rose-500/10 px-4 py-2.5 text-xs font-bold text-rose-300 transition hover:bg-rose-500/20"
          >
            خروج ادمین
          </button>
        </div>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {(["all", "pending", "approved", "rejected"] as Filter[]).map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => setFilter(key)}
            className={`rounded-2xl border p-4 text-right transition ${filter === key ? "border-amber-400/60 bg-amber-400/10" : "border-[rgba(148,184,220,0.16)] bg-white/5 hover:bg-white/10"}`}
          >
            <span className="block text-xs font-bold text-[var(--muted)]">
              {key === "all" ? "کل سفارش‌ها" : statusLabels[key]}
            </span>
            <span className="mt-1 block text-2xl font-black text-white">{faNum(counts[key])}</span>
          </button>
        ))}
      </div>

      {error && (
        <div role="alert" className="mb-5 rounded-2xl border border-rose-400/40 bg-rose-500/10 px-4 py-3 text-sm leading-6 text-rose-200">
          {error}
        </div>
      )}
      {message && (
        <div className="mb-5 rounded-2xl border border-emerald-400/40 bg-emerald-500/10 px-4 py-3 text-sm leading-6 text-emerald-200">
          {message}
        </div>
      )}

      <div className="grid gap-5 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <section className="space-y-3" aria-label="فهرست سفارش‌ها">
          {loading && orders.length === 0 ? (
            <div className="glass-card rounded-3xl p-12 text-center text-sm text-[var(--muted)]">در حال بارگذاری سفارش‌ها...</div>
          ) : visibleOrders.length === 0 ? (
            <div className="glass-card rounded-3xl p-12 text-center">
              <PackageIcon className="mx-auto h-10 w-10 text-[var(--muted)]" />
              <p className="mt-4 font-bold text-white">سفارشی در این بخش نیست</p>
            </div>
          ) : visibleOrders.map((order) => (
            <button
              key={order.id}
              type="button"
              onClick={() => setSelectedId(order.id)}
              className={`glass-card block w-full rounded-2xl p-4 text-right transition hover:border-amber-400/50 ${selectedId === order.id ? "border-amber-400/70 bg-amber-400/10" : ""}`}
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-black text-white">سفارش #{faNum(order.id)}</p>
                  <p className="mt-1 text-xs text-[var(--muted)]">{dateLabel(order.createdAt)}</p>
                </div>
                <span className={`rounded-full border px-2.5 py-1 text-[10px] font-bold ${statusClasses(order.status)}`}>
                  {statusLabels[order.status] ?? order.status}
                </span>
              </div>
              <div className="mt-3 flex items-center justify-between gap-2 border-t border-[rgba(148,184,220,0.14)] pt-3">
                <span className="min-w-0 truncate text-sm font-bold text-white">{order.fullName}</span>
                <span className="shrink-0 text-sm font-black text-amber-300">{formatToman(order.totalAmount)}</span>
              </div>
              <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-[var(--muted)]">
                <span>{faNum(order.items.length)} قلم</span>
                <span>{order.deliveryMethod === "pickup" ? "تحویل حضوری" : "ارسال با پیک"}</span>
                {order.receiptAvailable && <span className="text-teal-200">فیش دارد</span>}
                <span className={order.telegramStatus === "sent" ? "text-emerald-200" : "text-amber-200"}>
                  {order.telegramStatus === "sent" ? "اعلان ادمین ارسال شد" : "اعلان تلگرام تنظیم نشده/ناموفق"}
                </span>
              </div>
            </button>
          ))}
        </section>

        <section className="glass-card min-h-[520px] rounded-3xl p-5 sm:p-6" aria-label="جزئیات سفارش">
          {detailLoading ? (
            <div className="grid min-h-[450px] place-items-center text-sm text-[var(--muted)]">در حال دریافت جزئیات و فیش...</div>
          ) : !detail ? (
            <div className="grid min-h-[450px] place-items-center text-center text-sm text-[var(--muted)]">
              <div>
                <ReceiptIcon className="mx-auto h-10 w-10 text-amber-300" />
                <p className="mt-3">برای مشاهده اطلاعات خریدار، یک سفارش را انتخاب کنید.</p>
              </div>
            </div>
          ) : (
            <div>
              <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[rgba(148,184,220,0.14)] pb-4">
                <div>
                  <h2 className="text-lg font-black text-white">جزئیات سفارش #{faNum(detail.id)}</h2>
                  <p className="mt-1 text-xs text-[var(--muted)]">ثبت‌شده در {dateLabel(detail.createdAt)}</p>
                </div>
                <span className={`rounded-full border px-3 py-1.5 text-xs font-bold ${statusClasses(detail.status)}`}>
                  {statusLabels[detail.status] ?? detail.status}
                </span>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl bg-white/5 p-4 text-sm">
                  <p className="flex items-center gap-1.5 text-xs text-[var(--muted)]"><UserIcon className="h-4 w-4 text-teal-300" /> خریدار</p>
                  <p className="mt-2 font-black text-white">{detail.fullName}</p>
                  {detail.username && <p className="mt-1 text-xs text-[var(--muted)]" dir="ltr">@{detail.username}</p>}
                  <a href={`tel:${detail.phone}`} className="mt-2 flex items-center gap-1.5 font-bold text-amber-200 hover:underline" dir="ltr">
                    <PhoneIcon className="h-3.5 w-3.5" /> {detail.phone}
                  </a>
                  {detail.accountPhone && detail.accountPhone !== detail.phone && (
                    <p className="mt-1 text-[11px] text-[var(--muted)]">شماره حساب: <span dir="ltr">{detail.accountPhone}</span></p>
                  )}
                  <div className="mt-3 flex flex-wrap gap-2">
                    <a href={`tel:${detail.phone}`} className="rounded-lg bg-teal-400/10 px-2.5 py-1.5 text-[11px] font-bold text-teal-200">تماس با مشتری</a>
                    <a href={`https://wa.me/${detail.phone.replace(/^0/, "98")}`} target="_blank" rel="noreferrer" className="rounded-lg bg-emerald-400/10 px-2.5 py-1.5 text-[11px] font-bold text-emerald-200">واتساپ</a>
                  </div>
                </div>
                <div className="rounded-2xl bg-white/5 p-4 text-sm">
                  <p className="flex items-center gap-1.5 text-xs text-[var(--muted)]">
                    {detail.deliveryMethod === "pickup" ? <MapPinIcon className="h-4 w-4 text-teal-300" /> : <TruckIcon className="h-4 w-4 text-amber-300" />}
                    روش تحویل
                  </p>
                  <p className="mt-2 font-black text-white">{detail.deliveryMethod === "pickup" ? "تحویل حضوری" : "ارسال با پیک"}</p>
                  <p className="mt-1 leading-6 text-[var(--muted)]">{detail.deliveryMethod === "pickup" ? STORE_ADDRESS : detail.address || "آدرس ثبت نشده"}</p>
                </div>
              </div>

              {detail.username && <SellerMessages key={detail.id} recipient={detail.username} compact />}

              {detail.customerNote && (
                <div className="mt-4 rounded-2xl border border-teal-400/20 bg-teal-400/5 p-4 text-sm leading-7">
                  <p className="font-black text-teal-200">توضیح مشتری</p>
                  <p className="mt-1 text-[var(--muted)]">{detail.customerNote}</p>
                </div>
              )}

              <div className="mt-5">
                <p className="mb-2 flex items-center gap-1.5 text-sm font-black text-white"><PackageIcon className="h-4 w-4 text-amber-300" /> محصولات خریداری‌شده</p>
                <div className="space-y-2">
                  {detail.items.map((item) => (
                    <div key={item.id} className="flex items-center justify-between gap-3 rounded-xl bg-white/5 px-3 py-2.5 text-xs">
                      <span className="min-w-0 text-[var(--muted)]">{item.productName} <span className="text-[10px]">(کد {faNum(item.productCode)}) × {faNum(item.quantity)}</span></span>
                      <span className="shrink-0 font-bold text-white">{formatToman(item.unitPrice * item.quantity)}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-3 flex items-center justify-between border-t border-[rgba(148,184,220,0.14)] pt-3 text-sm">
                  <span className="font-black text-white">جمع کل</span>
                  <span className="font-black text-amber-300">{formatToman(detail.totalAmount)}</span>
                </div>
              </div>

              <div className="mt-5">
                <p className="mb-2 flex items-center gap-1.5 text-sm font-black text-white"><ReceiptIcon className="h-4 w-4 text-teal-300" /> فیش واریزی مشتری</p>
                {detail.receiptImage ? (
                  <div className="overflow-hidden rounded-2xl border border-[rgba(148,184,220,0.2)] bg-black/30">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={detail.receiptImage} alt={`فیش سفارش ${detail.id}`} className="max-h-72 w-full object-contain" />
                  </div>
                ) : <p className="rounded-xl bg-white/5 p-3 text-xs text-[var(--muted)]">فیشی ثبت نشده است.</p>}
              </div>

              <div className="mt-5 rounded-2xl border border-amber-400/20 bg-amber-400/5 p-4">
                <label htmlFor="admin-order-note" className="mb-2 block text-xs font-black text-amber-200">یادداشت فروشنده / نتیجه تماس</label>
                <textarea
                  id="admin-order-note"
                  value={adminNote}
                  onChange={(event) => setAdminNote(event.target.value)}
                  rows={2}
                  maxLength={1000}
                  className="input-field resize-none"
                  placeholder="مثلاً مشتری تحویل حضوری را تأیید کرد"
                />
                <button type="button" onClick={() => void updateOrder({ adminNote: adminNote.trim() || null })} disabled={saving} className="btn-outline mt-2 rounded-xl px-4 py-2 text-xs disabled:opacity-50">ذخیره یادداشت</button>
              </div>

              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => void updateOrder({ status: "approved", adminNote: adminNote.trim() || null })}
                  disabled={saving || detail.status === "approved" || detail.status === "rejected"}
                  className="btn-primary rounded-xl py-3 text-sm disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <CheckIcon className="h-4 w-4" /> تأیید پرداخت و سفارش
                </button>
                <button
                  type="button"
                  onClick={() => void updateOrder({ status: "rejected", adminNote: adminNote.trim() || null })}
                  disabled={saving || detail.status === "rejected" || detail.status === "approved"}
                  className="rounded-xl border border-rose-400/35 bg-rose-500/10 py-3 text-sm font-black text-rose-200 transition hover:bg-rose-500/20 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  رد فیش / سفارش
                </button>
              </div>
              <p className="mt-3 flex items-center gap-1.5 text-[11px] leading-5 text-[var(--muted)]"><HeadsetIcon className="h-4 w-4 shrink-0 text-teal-300" /> پس از تأیید یا رد، نتیجه در صفحه سفارش مشتری نمایش داده می‌شود؛ برای هماهنگی می‌توانید همین حالا تماس بگیرید.</p>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
