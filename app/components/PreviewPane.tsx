import type { MouseEvent, RefObject } from "react";

type PreviewPaneProps = {
  hoveredColorName: string | null;
  imageSrc: string | null;
  imgRef: RefObject<HTMLImageElement | null>;
  isAnalyzing: boolean;
  isReadingFile: boolean;
  onImageClick: (event: MouseEvent<HTMLImageElement>) => void;
  onImageError: () => void;
  onImageLoad: () => void;
  onMouseLeave: () => void;
  onMouseMove: (event: MouseEvent<HTMLImageElement>) => void;
  overlayRef: RefObject<HTMLCanvasElement | null>;
  canvasRef: RefObject<HTMLCanvasElement | null>;
};

export function PreviewPane({
  canvasRef,
  hoveredColorName,
  imageSrc,
  imgRef,
  isAnalyzing,
  isReadingFile,
  onImageClick,
  onImageError,
  onImageLoad,
  onMouseLeave,
  onMouseMove,
  overlayRef,
}: PreviewPaneProps) {
  return (
    <div
      data-testid="preview-pane"
      aria-labelledby="preview-title"
      className="relative flex min-h-[420px] flex-1 items-center justify-center overflow-hidden rounded-[2rem] border border-white/10 bg-[linear-gradient(180deg,_rgba(255,255,255,0.04),_rgba(255,255,255,0.02))] shadow-2xl shadow-black/30 xl:min-h-[520px]"
    >
      {!imageSrc ? (
        <div className="mx-auto max-w-md px-6 text-center">
          <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full border border-dashed border-cyan-300/30 bg-cyan-300/10 text-3xl text-cyan-100">
            +
          </div>
          <h2 id="preview-title" className="text-2xl font-semibold text-white">Upload an image to start analysis</h2>
          <p className="mt-3 text-sm leading-6 text-neutral-400">
            We will sample the image on canvas, match each pixel to the nearest named color
            from your palette, and show the dominant result set.
          </p>
        </div>
      ) : (
        <div className="relative flex max-h-full max-w-full items-center justify-center p-4 sm:p-6">
          {(isReadingFile || isAnalyzing) && (
            <div className="absolute inset-0 z-10 flex items-center justify-center rounded-[1.75rem] bg-black/45 backdrop-blur-sm">
              <div className="rounded-2xl border border-white/10 bg-white/10 px-5 py-4 text-center shadow-xl">
                <div className="text-sm font-semibold text-white">
                  {isReadingFile ? "Preparing image..." : "Running analysis..."}
                </div>
                <div className="mt-1 text-xs text-neutral-300">
                  Matching sampled pixels against the palette.
                </div>
              </div>
            </div>
          )}

          <div className="relative group max-h-full">
            {/* Uploaded data URLs do not benefit from Next.js image optimization. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              data-testid="preview-image"
              ref={imgRef}
              src={imageSrc}
              alt="Uploaded image preview for color analysis"
              aria-describedby="preview-interaction-help"
              onLoad={onImageLoad}
              onError={onImageError}
              onMouseMove={onMouseMove}
              onClick={onImageClick}
              onMouseLeave={onMouseLeave}
              className="max-h-[72vh] w-auto max-w-full cursor-crosshair select-none rounded-[1.75rem] border border-white/10 shadow-[0_30px_80px_rgba(0,0,0,0.55)]"
            />
            <p id="preview-interaction-help" className="sr-only">
              Hover on desktop or tap on mobile to inspect a point on the image and reveal the nearest named color.
            </p>
            <canvas ref={canvasRef} className="hidden" />
            <canvas
              ref={overlayRef}
              className="pointer-events-none absolute left-0 top-0 h-full w-full rounded-[1.75rem]"
            />

            {hoveredColorName && (
              <div
                data-testid="hovered-color-badge"
                aria-live="polite"
                className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full border border-white/15 bg-white px-4 py-2 text-xs font-semibold text-black shadow-2xl"
              >
                {hoveredColorName}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
