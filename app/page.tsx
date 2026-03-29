"use client";

import {
  ChangeEvent,
  MouseEvent,
  startTransition,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { getColorListWithLab } from "@a.r.i_eze/color-matcher";
import { AnalysisCard } from "@/app/components/AnalysisCard";
import { DistributionList } from "@/app/components/DistributionList";
import { DominantSwatches } from "@/app/components/DominantSwatches";
import { ExportActionsCard } from "@/app/components/ExportActionsCard";
import { HarmonySuggestions } from "@/app/components/HarmonySuggestions";
import { PreviewPane } from "@/app/components/PreviewPane";
import { SessionInfoCard } from "@/app/components/SessionInfoCard";
import { TopColorCard } from "@/app/components/TopColorCard";
import { UploadCard } from "@/app/components/UploadCard";
import { rgbToHex, type UploadDetails } from "@/lib/color-analyzer-ui";
import {
  type ColorAnalysisResult,
  DeltaMethodKey,
  EMPTY_ANALYSIS_RESULT,
  analyzePixelData,
  findClosestPaletteColor,
} from "@/lib/color-analysis";
import type {
  AnalyzeImageWorkerRequest,
  AnalyzeImageWorkerResponse,
} from "@/lib/color-analysis-worker";
import {
  type HarmonyMode,
  generateHarmonySuggestions,
} from "@/lib/color-harmony";
import { reportMonitoringEvent } from "@/lib/monitoring";

const TOP_COLORS_DEFAULT = 5;
const KMEANS_CLUSTERS = 5;
const SAMPLE_SIZE = 80;
const MAX_FILE_SIZE_BYTES = 15 * 1024 * 1024;

export default function ColorAnalyzer() {
  const imgRef = useRef<HTMLImageElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const overlayRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const workerRef = useRef<Worker | null>(null);
  const analysisRequestIdRef = useRef(0);

  const [analysis, setAnalysis] = useState(EMPTY_ANALYSIS_RESULT);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [deltaMethod, setDeltaMethod] = useState<DeltaMethodKey>("CIE2000");
  const [showFullList, setShowFullList] = useState(false);
  const [hoveredColorName, setHoveredColorName] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isReadingFile, setIsReadingFile] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [exportStatusMessage, setExportStatusMessage] = useState<string | null>(null);
  const [harmonyMode, setHarmonyMode] = useState<HarmonyMode>("All");
  const [uploadDetails, setUploadDetails] = useState<UploadDetails | null>(null);

  useEffect(() => {
    const worker = new Worker(
      new URL("./workers/color-analysis.worker.ts", import.meta.url),
      { type: "module" },
    );

    worker.onmessage = (event: MessageEvent<AnalyzeImageWorkerResponse>) => {
      const message = event.data;

      if (message.id !== analysisRequestIdRef.current) {
        return;
      }

      if (message.type === "error") {
        setErrorMessage(message.error);
        setIsAnalyzing(false);
        void reportMonitoringEvent({
          context: {
            requestId: message.id,
          },
          level: "error",
          message: message.error,
          source: "color-analysis.worker",
        });
        return;
      }

      startTransition(() => {
        setAnalysis(message.analysis);
        setIsAnalyzing(false);
      });
    };

    workerRef.current = worker;
    worker.onerror = (event) => {
      setErrorMessage("Background image analysis failed.");
      setIsAnalyzing(false);
      void reportMonitoringEvent({
        context: {
          filename: event.filename,
          line: event.lineno,
          message: event.message,
        },
        level: "error",
        message: "Worker runtime error",
        source: "color-analysis.worker.onerror",
      });
    };

    return () => {
      worker.terminate();
      workerRef.current = null;
    };
  }, []);

  const palette = useMemo(() => getColorListWithLab(), []);
  const paletteMap = useMemo(() => {
    const map = new Map<string, string>();
    palette.forEach((color) => map.set(color.name, color.hex));
    return map;
  }, [palette]);

  const totalDetectedSamples = useMemo(
    () => Object.values(analysis.counts).reduce((sum, count) => sum + count, 0),
    [analysis.counts],
  );

  const topColor = useMemo(() => {
    const [name, percent] = Object.entries(analysis.percentages).sort(
      (left, right) => parseFloat(right[1]) - parseFloat(left[1]),
    )[0] ?? [];

    if (!name || !percent) {
      return null;
    }

    return {
      name,
      percent,
      hex: paletteMap.get(name) ?? "#000000",
    };
  }, [analysis.percentages, paletteMap]);

  const sortedColors = useMemo(() => {
    return Object.entries(analysis.percentages)
      .sort((left, right) => parseFloat(right[1]) - parseFloat(left[1]))
      .slice(0, showFullList ? undefined : TOP_COLORS_DEFAULT);
  }, [analysis.percentages, showFullList]);

  const harmonySuggestions = useMemo(
    () => generateHarmonySuggestions(analysis.dominantColors, palette),
    [analysis.dominantColors, palette],
  );

  const filteredHarmonySuggestions = useMemo(() => {
    if (harmonyMode === "All") {
      return harmonySuggestions;
    }

    return harmonySuggestions.filter((suggestion) => suggestion.kind === harmonyMode);
  }, [harmonyMode, harmonySuggestions]);

  const resetPreviewOverlay = useCallback(() => {
    const overlay = overlayRef.current;
    const context = overlay?.getContext("2d");

    context?.clearRect(0, 0, overlay?.width ?? 0, overlay?.height ?? 0);
  }, []);

  const resetAnalysis = useCallback(() => {
    setAnalysis(EMPTY_ANALYSIS_RESULT);
    setImageSrc(null);
    setHoveredColorName(null);
    setShowFullList(false);
    setErrorMessage(null);
    setExportStatusMessage(null);
    setHarmonyMode("All");
    setIsReadingFile(false);
    setIsAnalyzing(false);
    setUploadDetails(null);
    resetPreviewOverlay();

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, [resetPreviewOverlay]);

  const analyzeImage = useCallback(
    (method = deltaMethod) => {
      const img = imgRef.current;
      const canvas = canvasRef.current;
      const overlay = overlayRef.current;

      if (!img || !canvas || !overlay) {
        return;
      }

      setIsAnalyzing(true);

      requestAnimationFrame(() => {
        const dpr = window.devicePixelRatio || 1;

        overlay.width = img.clientWidth * dpr;
        overlay.height = img.clientHeight * dpr;
        overlay.style.width = `${img.clientWidth}px`;
        overlay.style.height = `${img.clientHeight}px`;

        const overlayContext = overlay.getContext("2d");
        if (overlayContext) {
          overlayContext.setTransform(1, 0, 0, 1, 0, 0);
          overlayContext.scale(dpr, dpr);
          overlayContext.clearRect(0, 0, overlay.width, overlay.height);
        }

        const context = canvas.getContext("2d");
        if (!context) {
          setIsAnalyzing(false);
          return;
        }

        canvas.width = SAMPLE_SIZE;
        canvas.height = SAMPLE_SIZE;
        context.drawImage(img, 0, 0, SAMPLE_SIZE, SAMPLE_SIZE);

        const imageData = context.getImageData(0, 0, SAMPLE_SIZE, SAMPLE_SIZE);
        const requestId = analysisRequestIdRef.current + 1;
        analysisRequestIdRef.current = requestId;

        if (workerRef.current) {
          const request: AnalyzeImageWorkerRequest = {
            clusterCount: KMEANS_CLUSTERS,
            deltaMethod: method,
            id: requestId,
            palette,
            pixels: imageData.data,
          };

          workerRef.current.postMessage(request);
          return;
        }

        const nextAnalysis: ColorAnalysisResult = analyzePixelData(
          { data: imageData.data },
          {
            palette,
            deltaMethod: method,
            clusterCount: KMEANS_CLUSTERS,
          },
        );

        startTransition(() => {
          setAnalysis(nextAnalysis);
          setIsAnalyzing(false);
        });
      });
    },
    [deltaMethod, palette],
  );

  const inspectPixel = useCallback(
    (clientX: number, clientY: number) => {
      const img = imgRef.current;
      const canvas = canvasRef.current;
      const overlay = overlayRef.current;
      if (!img || !canvas || !overlay) {
        return;
      }

      const context = canvas.getContext("2d");
      const overlayContext = overlay.getContext("2d");
      if (!context || !overlayContext) {
        return;
      }

      const rect = img.getBoundingClientRect();
      const xOnImage = clientX - rect.left;
      const yOnImage = clientY - rect.top;

      if (
        xOnImage < 0 ||
        yOnImage < 0 ||
        xOnImage > rect.width ||
        yOnImage > rect.height
      ) {
        return;
      }

      const xSample = Math.min(
        canvas.width - 1,
        Math.max(0, Math.floor((xOnImage * canvas.width) / rect.width)),
      );
      const ySample = Math.min(
        canvas.height - 1,
        Math.max(0, Math.floor((yOnImage * canvas.height) / rect.height)),
      );

      const pixel = context.getImageData(xSample, ySample, 1, 1).data;
      const closest = findClosestPaletteColor(
        { r: pixel[0], g: pixel[1], b: pixel[2] },
        palette,
        deltaMethod,
      );

      setHoveredColorName(closest?.name ?? null);
      overlayContext.clearRect(0, 0, overlay.width, overlay.height);

      if (!closest) {
        return;
      }

      overlayContext.beginPath();
      overlayContext.arc(xOnImage, yOnImage, 6, 0, Math.PI * 2);
      overlayContext.strokeStyle = "white";
      overlayContext.lineWidth = 2;
      overlayContext.stroke();

      overlayContext.beginPath();
      overlayContext.arc(xOnImage, yOnImage, 7, 0, Math.PI * 2);
      overlayContext.strokeStyle = "black";
      overlayContext.lineWidth = 1;
      overlayContext.stroke();
    },
    [deltaMethod, palette],
  );

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    const handleResize = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        if (imgRef.current && imageSrc) {
          analyzeImage();
        }
      }, 250);
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      clearTimeout(timeoutId);
    };
  }, [analyzeImage, imageSrc]);

  const handleImage = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      setErrorMessage("Please choose a valid image file.");
      return;
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      setErrorMessage("Please choose an image smaller than 15 MB.");
      return;
    }

    setAnalysis(EMPTY_ANALYSIS_RESULT);
    setHoveredColorName(null);
    setShowFullList(false);
    setErrorMessage(null);
    setExportStatusMessage(null);
    setIsReadingFile(true);
    setIsAnalyzing(false);
    setUploadDetails({
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
    });

    const reader = new FileReader();

    reader.onload = () => {
      if (typeof reader.result === "string") {
        setImageSrc(reader.result);
        return;
      }

      setErrorMessage("The selected file could not be read.");
      setIsReadingFile(false);
    };

    reader.onerror = () => {
      setErrorMessage("The selected file could not be read.");
      setIsReadingFile(false);
    };

    reader.readAsDataURL(file);
  };

  const handleFormulaChange = (method: DeltaMethodKey) => {
    setDeltaMethod(method);

    if (imageSrc && imgRef.current?.complete) {
      analyzeImage(method);
    }
  };

  const handleMouseMove = (event: MouseEvent<HTMLImageElement>) => {
    inspectPixel(event.clientX, event.clientY);
  };

  const handleImageClick = (event: MouseEvent<HTMLImageElement>) => {
    inspectPixel(event.clientX, event.clientY);
  };

  const handleMouseLeave = () => {
    setHoveredColorName(null);
    resetPreviewOverlay();
  };

  const buildExportPayload = useCallback(() => {
    return {
      file: uploadDetails,
      formula: deltaMethod,
      sampleResolution: SAMPLE_SIZE,
      totalDetectedSamples,
      percentages: analysis.percentages,
      dominantColors: analysis.dominantColors.map((color) => ({
        hex: rgbToHex(color),
        rgb: color,
      })),
    };
  }, [analysis.dominantColors, analysis.percentages, deltaMethod, totalDetectedSamples, uploadDetails]);

  const downloadTextFile = useCallback(
    (content: string, extension: "csv" | "json", suggestedName: string) => {
      const userInput = window.prompt("Enter file name", suggestedName);
      if (userInput === null) {
        return;
      }

      const fileName = userInput || suggestedName;
      const blob = new Blob([content], {
        type: extension === "csv" ? "text/csv" : "application/json",
      });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `${fileName}.${extension}`;
      anchor.click();
      URL.revokeObjectURL(url);
    },
    [],
  );

  const copyToClipboard = useCallback(async (text: string, successMessage: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setExportStatusMessage(successMessage);
    } catch {
      setExportStatusMessage("Clipboard access was not available in this browser.");
      void reportMonitoringEvent({
        level: "info",
        message: "Clipboard write failed",
        source: "clipboard.writeText",
      });
    }
  }, []);

  const exportJSON = () => {
    downloadTextFile(JSON.stringify(buildExportPayload(), null, 2), "json", "color-analysis");
  };

  const exportCSV = () => {
    const header = "name,percent,hex,samples";
    const rows = Object.entries(analysis.percentages)
      .sort((left, right) => parseFloat(right[1]) - parseFloat(left[1]))
      .map(([name, percent]) => {
        const hex = paletteMap.get(name) ?? "";
        const samples = analysis.counts[name] ?? 0;
        return `"${name.replaceAll('"', '""')}",${percent},${hex},${samples}`;
      });

    downloadTextFile([header, ...rows].join("\n"), "csv", "color-analysis");
  };

  const copyJson = async () => {
    await copyToClipboard(
      JSON.stringify(buildExportPayload(), null, 2),
      "Copied analysis JSON to the clipboard.",
    );
  };

  const copySummary = async () => {
    const summaryLines = [
      "DeltaE Vision analysis summary",
      `Formula: ${deltaMethod}`,
      uploadDetails ? `File: ${uploadDetails.fileName}` : "File: none",
      `Detected samples: ${totalDetectedSamples}`,
      topColor ? `Top match: ${topColor.name} (${topColor.percent}%, ${topColor.hex})` : "Top match: none",
      "Top colors:",
      ...Object.entries(analysis.percentages)
        .sort((left, right) => parseFloat(right[1]) - parseFloat(left[1]))
        .slice(0, 5)
        .map(([name, percent]) => {
          const hex = paletteMap.get(name) ?? "#000000";
          return `- ${name}: ${percent}% (${hex})`;
        }),
      "Powered by @a.r.i_eze/color-matcher",
    ];

    await copyToClipboard(summaryLines.join("\n"), "Copied analysis summary to the clipboard.");
  };

  const copyHexPalette = async () => {
    const hexPalette = analysis.dominantColors.map((color) => rgbToHex(color)).join(", ");
    await copyToClipboard(
      hexPalette,
      "Copied dominant swatch hex values to the clipboard.",
    );
  };

  const copyHarmonyPalette = async () => {
    const harmonyPalette = harmonySuggestions
      .filter((suggestion) => harmonyMode === "All" || suggestion.kind === harmonyMode)
      .map(
        (suggestion) =>
          `${suggestion.kind}: ${suggestion.hex} -> ${suggestion.matchedName} (${suggestion.matchedHex})`,
      )
      .join("\n");

    await copyToClipboard(
      harmonyPalette,
      "Copied harmony suggestions to the clipboard.",
    );
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(80,120,255,0.18),transparent_32%),linear-gradient(180deg,#06070A_0%,#0F1118_100%)] text-neutral-100">
      <div className="mx-auto flex min-h-screen w-full max-w-400 flex-col xl:h-screen xl:overflow-hidden xl:flex-row">
        <aside className="w-full border-b border-white/10 bg-black/20 backdrop-blur-xl xl:h-screen xl:w-97.5 xl:shrink-0 xl:overflow-y-auto xl:border-b-0 xl:border-r">
          <div className="flex h-full flex-col gap-6 p-5 sm:p-6">
            <header className="space-y-3">
              <div className="inline-flex items-center rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-cyan-200">
                DeltaE Vision
              </div>
              <div className="space-y-2">
                <h1 className="text-3xl font-semibold tracking-tight text-white">
                  Perceptual image color analysis for real-world uploads.
                </h1>
                <p className="max-w-md text-sm leading-6 text-neutral-300">
                  Compare sampled pixels against your named palette, inspect the
                  nearest match, and export the full analysis with dominant
                  swatches.
                </p>
                <p className="text-xs uppercase tracking-[0.18em] text-neutral-500">
                  Powered by <a href="https://www.npmjs.com/package/@a.r.i_eze/color-matcher" target="_blank" rel="noopener noreferrer" className="text-cyan-200">@a.r.i_eze/color-matcher</a>
                </p>
              </div>
            </header>

            <UploadCard
              errorMessage={errorMessage}
              fileInputRef={fileInputRef}
              imageSrc={imageSrc}
              isReadingFile={isReadingFile}
              onChange={handleImage}
              onReset={resetAnalysis}
              uploadDetails={uploadDetails}
            />

            <AnalysisCard
              deltaMethod={deltaMethod}
              imageSrc={imageSrc}
              isAnalyzing={isAnalyzing}
              isReadingFile={isReadingFile}
              onFormulaChange={handleFormulaChange}
              sampleSize={SAMPLE_SIZE}
              totalDetectedSamples={totalDetectedSamples}
              totalMatches={Object.keys(analysis.counts).length}
            />

            {topColor && (
              <TopColorCard
                hex={topColor.hex}
                name={topColor.name}
                percent={topColor.percent}
              />
            )}

            {Object.keys(analysis.counts).length > 0 && (
              <DistributionList
                counts={analysis.counts}
                hoveredColorName={hoveredColorName}
                onToggleShowFullList={() => setShowFullList((current) => !current)}
                paletteMap={paletteMap}
                showFullList={showFullList}
                sortedColors={sortedColors}
              />
            )}

            <ExportActionsCard
              canExport={Object.keys(analysis.counts).length > 0}
              onCopyJson={copyJson}
              onCopySummary={copySummary}
              onExportCsv={exportCSV}
              onExportJson={exportJSON}
              statusMessage={exportStatusMessage}
            />
          </div>
        </aside>

        <main className="relative flex min-w-0 flex-1 flex-col gap-4 p-4 sm:p-6 xl:h-screen xl:min-h-0 xl:overflow-y-auto xl:p-8">
          <PreviewPane
            canvasRef={canvasRef}
            hoveredColorName={hoveredColorName}
            imageSrc={imageSrc}
            imgRef={imgRef}
            isAnalyzing={isAnalyzing}
            isReadingFile={isReadingFile}
            onImageClick={handleImageClick}
            onImageError={() => {
              setIsReadingFile(false);
              setIsAnalyzing(false);
              setErrorMessage("The selected image could not be rendered.");
              void reportMonitoringEvent({
                context: {
                  fileName: uploadDetails?.fileName,
                  fileType: uploadDetails?.fileType,
                },
                level: "error",
                message: "The selected image could not be rendered.",
                source: "preview-image.onerror",
              });
            }}
            onImageLoad={() => {
              setIsReadingFile(false);
              analyzeImage();
            }}
            onMouseLeave={handleMouseLeave}
            onMouseMove={handleMouseMove}
            overlayRef={overlayRef}
          />

          <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr] xl:shrink-0">
            <DominantSwatches
              dominantColors={analysis.dominantColors}
              onCopyHexPalette={copyHexPalette}
            />
            <SessionInfoCard deltaMethod={deltaMethod} uploadDetails={uploadDetails} />
          </div>

          <HarmonySuggestions
            mode={harmonyMode}
            onChangeMode={setHarmonyMode}
            onCopyHarmonyPalette={copyHarmonyPalette}
            suggestions={filteredHarmonySuggestions}
          />
        </main>
      </div>
    </div>
  );
}
