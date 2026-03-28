import type { RGB } from "@a.r.i_eze/color-matcher";
import { formatRgb, rgbToHex } from "@/lib/color-analyzer-ui";

type DominantSwatchesProps = {
  dominantColors: RGB[];
  onCopyHexPalette: () => void;
};

export function DominantSwatches({
  dominantColors,
  onCopyHexPalette,
}: DominantSwatchesProps) {
  return (
    <section
      data-testid="dominant-swatches"
      className="rounded-[1.75rem] border border-white/10 bg-white/5 p-4 shadow-2xl shadow-black/20"
    >
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-white">Dominant swatches</h2>
          <p className="text-xs text-neutral-400">
            Representative cluster colors from the sampled image.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-xs text-neutral-500">{dominantColors.length} clusters</div>
          <button
            type="button"
            onClick={onCopyHexPalette}
            disabled={dominantColors.length === 0}
            className="rounded-full border border-white/10 px-3 py-1 text-xs font-medium text-neutral-300 transition hover:border-white/20 hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:border-white/5 disabled:text-neutral-600 cursor-pointer"
          >
            Copy hex
          </button>
        </div>
      </div>

      {dominantColors.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/10 bg-black/20 p-5 text-sm text-neutral-500">
          Dominant swatches will appear after an image is analyzed.
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {dominantColors.map((color, index) => {
            const hex = rgbToHex(color);

            return (
              <div
                data-testid="dominant-swatch"
                key={`${hex}-${index}`}
                className="rounded-2xl border border-white/10 bg-black/20 p-3"
              >
                <div
                  className="h-20 rounded-xl border border-white/10 shadow-inner"
                  style={{ backgroundColor: hex }}
                />
                <div className="mt-3 space-y-1">
                  <div className="text-xs uppercase tracking-[0.18em] text-neutral-500">
                    Cluster {index + 1}
                  </div>
                  <div className="font-mono text-sm text-white">{hex}</div>
                  <div className="text-xs text-neutral-400">rgb({formatRgb(color)})</div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
