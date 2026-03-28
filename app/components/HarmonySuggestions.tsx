import type { HarmonyMode, HarmonySuggestion } from "@/lib/color-harmony";
import { formatRgb } from "@/lib/color-analyzer-ui";

type HarmonySuggestionsProps = {
  mode: HarmonyMode;
  onChangeMode: (mode: HarmonyMode) => void;
  onCopyHarmonyPalette: () => void;
  suggestions: HarmonySuggestion[];
};

export function HarmonySuggestions({
  mode,
  onChangeMode,
  onCopyHarmonyPalette,
  suggestions,
}: HarmonySuggestionsProps) {
  return (
    <section
      data-testid="harmony-suggestions"
      aria-labelledby="harmony-card-title"
      className="rounded-[1.75rem] border border-white/10 bg-white/5 p-4 shadow-2xl shadow-black/20"
    >
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h2 id="harmony-card-title" className="text-sm font-semibold text-white">Harmony suggestions</h2>
          <p id="harmony-help" className="text-xs text-neutral-400">
            Suggested companion colors generated from the dominant swatches.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select
            data-testid="harmony-mode-select"
            aria-label="Select harmony mode"
            aria-describedby="harmony-help"
            value={mode}
            onChange={(event) => onChangeMode(event.target.value as HarmonyMode)}
            className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-xs font-medium text-neutral-300 outline-none transition focus:border-cyan-300/50 focus-visible:ring-2 focus-visible:ring-cyan-300"
          >
            <option value="All">All modes</option>
            <option value="Complementary">Complementary</option>
            <option value="Analogous">Analogous</option>
            <option value="Triadic">Triadic</option>
          </select>
          <button
            type="button"
            onClick={onCopyHarmonyPalette}
            disabled={suggestions.length === 0}
            aria-label="Copy visible harmony suggestions"
            className="cursor-pointer rounded-full border border-white/10 px-3 py-1 text-xs font-medium text-neutral-300 transition hover:border-white/20 hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:border-white/5 disabled:text-neutral-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
          >
            Copy harmony
          </button>
        </div>
      </div>

      {suggestions.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/10 bg-black/20 p-5 text-sm text-neutral-500">
          Harmony suggestions will appear after dominant swatches are detected.
        </div>
      ) : (
        <div className="grid gap-3 lg:grid-cols-2 xl:grid-cols-3">
          {suggestions.map((suggestion) => (
            <div
              key={`${suggestion.kind}-${suggestion.hex}-${suggestion.baseSwatchIndex}`}
              data-testid="harmony-card"
              aria-label={`${suggestion.kind} harmony suggestion from cluster ${suggestion.baseSwatchIndex}`}
              className="rounded-2xl border border-white/10 bg-black/20 p-3"
            >
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <div className="text-xs uppercase tracking-[0.18em] text-neutral-500">
                    {suggestion.kind}
                  </div>
                  <div className="mt-1 text-xs text-neutral-400">
                    From cluster {suggestion.baseSwatchIndex}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div
                    className="h-8 w-8 rounded-lg border border-white/10"
                    style={{ backgroundColor: suggestion.baseHex }}
                    title={`Base ${suggestion.baseHex}`}
                  />
                  <div
                    className="h-10 w-10 rounded-xl border border-white/10 shadow-inner"
                    style={{ backgroundColor: suggestion.hex }}
                    title={suggestion.hex}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <div className="font-mono text-sm text-white">{suggestion.hex}</div>
                <div className="text-xs text-neutral-400">rgb({formatRgb(suggestion.rgb)})</div>
                <div className="text-xs text-cyan-200">
                  Nearest match: {suggestion.matchedName} ({suggestion.matchedHex})
                </div>
                {suggestion.wasBoosted && (
                  <div className="text-xs text-amber-200">
                    Muted base detected, harmony was boosted for readability.
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
