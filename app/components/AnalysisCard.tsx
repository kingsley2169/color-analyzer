import { DeltaMethodKey, deltaMethods } from "@/lib/color-analysis";

type AnalysisCardProps = {
  deltaMethod: DeltaMethodKey;
  imageSrc: string | null;
  isAnalyzing: boolean;
  isReadingFile: boolean;
  onFormulaChange: (method: DeltaMethodKey) => void;
  sampleSize: number;
  totalDetectedSamples: number;
  totalMatches: number;
};

export function AnalysisCard({
  deltaMethod,
  imageSrc,
  isAnalyzing,
  isReadingFile,
  onFormulaChange,
  sampleSize,
  totalDetectedSamples,
  totalMatches,
}: AnalysisCardProps) {
  return (
    <section
      data-testid="analysis-card"
      aria-labelledby="analysis-card-title"
      className="rounded-3xl border border-white/10 bg-white/5 p-4 shadow-2xl shadow-black/20"
    >
      <div className="mb-3">
        <h2 id="analysis-card-title" className="text-sm font-semibold text-white">Analysis</h2>
        <p id="analysis-help" className="text-xs text-neutral-400">
          Switch formulas to compare perceptual distance behavior.
        </p>
      </div>

      <label htmlFor="formula-select" className="mb-4 block text-xs font-medium uppercase tracking-[0.2em] text-neutral-400">
        Formula
      </label>
      <select
        data-testid="formula-select"
        id="formula-select"
        value={deltaMethod}
        onChange={(event) => onFormulaChange(event.target.value as DeltaMethodKey)}
        aria-describedby="analysis-help"
        className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-300/50 focus-visible:ring-2 focus-visible:ring-cyan-300"
      >
        {(Object.keys(deltaMethods) as DeltaMethodKey[]).map((method) => (
          <option key={method} value={method}>
            {method}
          </option>
        ))}
      </select>

      <div className="mt-4 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4 xl:grid-cols-2">
        <StatCard label="Samples" testId="samples-stat" value={String(totalDetectedSamples)} />
        <StatCard label="Resolution" testId="resolution-stat" value={`${sampleSize}x${sampleSize}`} />
        <StatCard label="Matches" testId="matches-stat" value={String(totalMatches)} />
        <StatCard
          ariaLive="polite"
          label="Status"
          testId="status-stat"
          value={
            isReadingFile ? "Reading" : isAnalyzing ? "Analyzing" : imageSrc ? "Ready" : "Waiting"
          }
          compact
        />
      </div>
    </section>
  );
}

function StatCard({
  ariaLive,
  compact = false,
  label,
  testId,
  value,
}: {
  ariaLive?: "polite";
  compact?: boolean;
  label: string;
  testId: string;
  value: string;
}) {
  return (
    <div
      data-testid={testId}
      aria-live={ariaLive}
      className="rounded-2xl border border-white/10 bg-black/20 p-3"
    >
      <div className="text-[11px] uppercase tracking-[0.18em] text-neutral-500">{label}</div>
      <div className={`mt-1 font-semibold text-white ${compact ? "text-sm" : "text-lg"}`}>
        {value}
      </div>
    </div>
  );
}
