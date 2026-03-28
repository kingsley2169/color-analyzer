type ExportActionsCardProps = {
  canExport: boolean;
  onCopyJson: () => void;
  onCopySummary: () => void;
  onExportCsv: () => void;
  onExportJson: () => void;
  statusMessage: string | null;
};

export function ExportActionsCard({
  canExport,
  onCopyJson,
  onCopySummary,
  onExportCsv,
  onExportJson,
  statusMessage,
}: ExportActionsCardProps) {
  return (
    <section
      aria-labelledby="export-card-title"
      className="rounded-3xl border border-white/10 bg-white/5 p-4 shadow-2xl shadow-black/20"
    >
      <div className="mb-4">
        <h2 id="export-card-title" className="text-sm font-semibold text-white">Share and export</h2>
        <p className="text-xs text-neutral-400">
          Copy quick summaries or download analysis data in multiple formats.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <ActionButton disabled={!canExport} label="Copy summary" onClick={onCopySummary} />
        <ActionButton disabled={!canExport} label="Copy JSON" onClick={onCopyJson} />
        <ActionButton disabled={!canExport} label="Export CSV" onClick={onExportCsv} />
        <ActionButton disabled={!canExport} label="Export JSON" onClick={onExportJson} primary />
      </div>

      <div aria-live="polite" className="mt-3 min-h-5 text-xs text-neutral-400">
        {statusMessage ?? "Exports include analysis metadata and dominant swatches."}
      </div>
    </section>
  );
}

function ActionButton({
  disabled,
  label,
  onClick,
  primary = false,
}: {
  disabled: boolean;
  label: string;
  onClick: () => void;
  primary?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className={
        primary
          ? "rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-neutral-950 transition hover:bg-cyan-100 disabled:cursor-not-allowed disabled:bg-white/30 disabled:text-neutral-500 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
          : "rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm font-semibold text-white transition hover:border-white/20 hover:bg-white/10 disabled:cursor-not-allowed disabled:border-white/5 disabled:bg-black/10 disabled:text-neutral-500 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
      }
    >
      {label}
    </button>
  );
}
