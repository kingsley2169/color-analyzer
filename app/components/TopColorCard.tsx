type TopColorCardProps = {
  hex: string;
  name: string;
  percent: string;
};

export function TopColorCard({ hex, name, percent }: TopColorCardProps) {
  return (
    <section
      data-testid="top-color-card"
      className="rounded-3xl border border-white/10 bg-white/5 p-4 shadow-2xl shadow-black/20"
    >
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-white">Leading match</h2>
          <p className="text-xs text-neutral-400">
            The most frequent named color from the sampled image.
          </p>
        </div>
        <div
          className="h-12 w-12 rounded-2xl border border-white/15 shadow-inner"
          style={{ backgroundColor: hex }}
        />
      </div>

      <div className="space-y-1">
        <div className="text-lg font-semibold text-white">{name}</div>
        <div className="text-sm text-neutral-300">{percent}% of detected samples</div>
        <div className="font-mono text-xs text-neutral-500">{hex}</div>
      </div>
    </section>
  );
}
