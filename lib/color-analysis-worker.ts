import type { ColorWithLab } from "@a.r.i_eze/color-matcher";
import type { ColorAnalysisResult, DeltaMethodKey } from "@/lib/color-analysis";

export type AnalyzeImageWorkerRequest = {
  clusterCount: number;
  deltaMethod: DeltaMethodKey;
  id: number;
  palette: ColorWithLab[];
  pixels: Uint8ClampedArray;
};

export type AnalyzeImageWorkerResponse =
  | {
      analysis: ColorAnalysisResult;
      id: number;
      type: "success";
    }
  | {
      error: string;
      id: number;
      type: "error";
    };
