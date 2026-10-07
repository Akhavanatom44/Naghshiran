const statusConfig: Record<string, { label: string; classes: string }> = {
  pending: {
    label: "⏳ در انتظار بررسی",
    classes: "bg-amber-500/15 text-amber-300 border-amber-400/40 pulse-glow",
  },
  approved: {
    label: "✅ تأیید شده",
    classes: "bg-emerald-500/15 text-emerald-300 border-emerald-400/40",
  },
  rejected: {
    label: "❌ رد شده",
    classes: "bg-rose-500/15 text-rose-300 border-rose-400/40",
  },
};

export default function StatusBadge({ status }: { status: string }) {
  const config = statusConfig[status] ?? statusConfig.pending;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-bold ${config.classes}`}
    >
      {config.label}
    </span>
  );
}
