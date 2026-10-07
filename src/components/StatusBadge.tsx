const statusConfig: Record<string, { label: string; classes: string }> = {
  pending: {
    label: "در انتظار بررسی",
    classes: "bg-amber-400/10 text-amber-300 border-amber-400/40 pulse-soft",
  },
  approved: {
    label: "تأیید شده",
    classes: "bg-emerald-400/10 text-emerald-300 border-emerald-400/40",
  },
  rejected: {
    label: "رد شده",
    classes: "bg-rose-400/10 text-rose-300 border-rose-400/40",
  },
};

export default function StatusBadge({ status }: { status: string }) {
  const config = statusConfig[status] ?? statusConfig.pending;
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold ${config.classes}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {config.label}
    </span>
  );
}
