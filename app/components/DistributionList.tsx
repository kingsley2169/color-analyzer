type DistributionListProps = {
  counts: Record<string, number>;
  hoveredColorName: string | null;
  onToggleShowFullList: () => void;
  paletteMap: Map<string, string>;
  showFullList: boolean;
  sortedColors: [string, string][];
};

export function DistributionList({
  counts,
  hoveredColorName,
  onToggleShowFullList,
  paletteMap,
  showFullList,
  sortedColors,
}: DistributionListProps) {
  return (
    <section
      data-testid="distribution-list"
      className="rounded-3xl border border-white/10 bg-white/5 p-4 shadow-2xl shadow-black/20"
    >
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-white">Color distribution</h2>
          <p className="text-xs text-neutral-400">
            Hover or tap the image to highlight matching entries.
          </p>
        </div>
        <button
          data-testid="toggle-colors"
          type="button"
          onClick={onToggleShowFullList}
          className="cursor-pointer rounded-full border border-white/10 px-3 py-1 text-xs font-medium text-neutral-300 transition hover:border-white/20 hover:bg-white/10 hover:text-white"
        >
          {showFullList ? "Show fewer" : "Show all"}
        </button>
      </div>

      <div className="space-y-3">
        {sortedColors.map(([name, percent], index) => {
          const hex = paletteMap.get(name) ?? "#000000";
          const isHovered = hoveredColorName === name;

          return (
            <div
              key={name}
              data-testid="distribution-item"
              className={`rounded-2xl border p-3 transition ${
                isHovered
                  ? "border-cyan-300/40 bg-cyan-300/10 shadow-lg shadow-cyan-950/40"
                  : "border-white/8 bg-black/20"
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 text-[11px] font-semibold text-white/80 shadow-inner"
                  style={{ backgroundColor: hex }}
                >
                  {index + 1}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-semibold text-white">{name}</div>
                  <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-neutral-400">
                    <span>{percent}%</span>
                    <span className="font-mono">{hex}</span>
                    <span>{counts[name]} samples</span>
                  </div>
                </div>
              </div>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/5">
                <div
                  className="h-full rounded-full bg-linear-to-r from-cyan-300 via-sky-400 to-indigo-400"
                  style={{ width: `${Math.min(parseFloat(percent), 100)}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
