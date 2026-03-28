/// <reference lib="webworker" />

import { analyzePixelData } from "@/lib/color-analysis";
import type {
  AnalyzeImageWorkerRequest,
  AnalyzeImageWorkerResponse,
} from "@/lib/color-analysis-worker";

self.onmessage = (event: MessageEvent<AnalyzeImageWorkerRequest>) => {
  const { clusterCount, deltaMethod, id, palette, pixels } = event.data;

  try {
    const analysis = analyzePixelData(
      { data: pixels },
      {
        clusterCount,
        deltaMethod,
        palette,
      },
    );

    const response: AnalyzeImageWorkerResponse = {
      analysis,
      id,
      type: "success",
    };

    self.postMessage(response);
  } catch (error) {
    const response: AnalyzeImageWorkerResponse = {
      error: error instanceof Error ? error.message : "Image analysis failed.",
      id,
      type: "error",
    };

    self.postMessage(response);
  }
};

export {};
