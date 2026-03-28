import {
  deltaE76,
  deltaE94,
  deltaE2000,
  rgbToLab,
} from "@a.r.i_eze/color-matcher";
import type { ColorWithLab, RGB } from "@a.r.i_eze/color-matcher";

export type MatchCount = Record<string, number>;

export const deltaMethods = {
  CIE76: deltaE76,
  CIE94: deltaE94,
  CIE2000: deltaE2000,
} as const;

export type DeltaMethodKey = keyof typeof deltaMethods;

export type ColorAnalysisOptions = {
  clusterCount?: number;
  deltaMethod?: DeltaMethodKey;
  palette: ColorWithLab[];
  pixelStep?: number;
};

export type PixelDataLike = {
  data: Uint8ClampedArray;
};

export type ColorAnalysisResult = {
  counts: MatchCount;
  dominantColors: RGB[];
  percentages: Record<string, string>;
};

const RGBA_CHANNELS = 4;
const DEFAULT_CLUSTER_COUNT = 5;
const DEFAULT_KMEANS_ITERATIONS = 6;
const DEFAULT_PIXEL_STEP = 4;

export const EMPTY_ANALYSIS_RESULT: ColorAnalysisResult = {
  counts: {},
  dominantColors: [],
  percentages: {},
};

export function sampleRgbPixels(
  pixelData: PixelDataLike,
  pixelStep = DEFAULT_PIXEL_STEP,
): RGB[] {
  const samples: RGB[] = [];
  const stride = Math.max(pixelStep, 1) * RGBA_CHANNELS;

  for (let i = 0; i < pixelData.data.length; i += stride) {
    samples.push({
      r: pixelData.data[i],
      g: pixelData.data[i + 1],
      b: pixelData.data[i + 2],
    });
  }

  return samples;
}

export function findClosestPaletteColor(
  rgb: RGB,
  palette: ColorWithLab[],
  deltaMethod: DeltaMethodKey,
): ColorWithLab | null {
  const sampleLab = rgbToLab(rgb);
  const deltaFunc = deltaMethods[deltaMethod];
  let closest: ColorWithLab | null = null;
  let minDistance = Number.POSITIVE_INFINITY;

  for (const color of palette) {
    const distance = deltaFunc(sampleLab, color.lab);

    if (distance < minDistance) {
      minDistance = distance;
      closest = color;
    }
  }

  return closest;
}

export function countPaletteMatches(
  rgbSamples: RGB[],
  palette: ColorWithLab[],
  deltaMethod: DeltaMethodKey,
): MatchCount {
  const counts: MatchCount = {};

  for (const sample of rgbSamples) {
    const closest = findClosestPaletteColor(sample, palette, deltaMethod);

    if (closest) {
      counts[closest.name] = (counts[closest.name] ?? 0) + 1;
    }
  }

  return counts;
}

export function clusterRgbValues(
  pixels: RGB[],
  k: number,
  iterations = DEFAULT_KMEANS_ITERATIONS,
): RGB[] {
  if (pixels.length === 0) {
    return [];
  }

  const actualK = Math.min(k, pixels.length);
  const centroids = pixels.slice(0, actualK).map((pixel) => ({ ...pixel }));

  for (let iter = 0; iter < iterations; iter += 1) {
    const clusters: RGB[][] = Array.from({ length: actualK }, () => []);

    for (const pixel of pixels) {
      let minDistance = Number.POSITIVE_INFINITY;
      let index = 0;

      for (let i = 0; i < centroids.length; i += 1) {
        const centroid = centroids[i];
        const distance =
          (pixel.r - centroid.r) ** 2 +
          (pixel.g - centroid.g) ** 2 +
          (pixel.b - centroid.b) ** 2;

        if (distance < minDistance) {
          minDistance = distance;
          index = i;
        }
      }

      clusters[index].push(pixel);
    }

    clusters.forEach((cluster, index) => {
      if (cluster.length === 0) {
        return;
      }

      const total = cluster.reduce(
        (acc, pixel) => ({
          r: acc.r + pixel.r,
          g: acc.g + pixel.g,
          b: acc.b + pixel.b,
        }),
        { r: 0, g: 0, b: 0 },
      );

      centroids[index] = {
        r: Math.round(total.r / cluster.length),
        g: Math.round(total.g / cluster.length),
        b: Math.round(total.b / cluster.length),
      };
    });
  }

  return dedupeRgbValues(centroids);
}

export function dedupeRgbValues(colors: RGB[]): RGB[] {
  const seen = new Set<string>();

  return colors.filter((color) => {
    const key = `${color.r}-${color.g}-${color.b}`;

    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
}

export function calculatePercentages(counts: MatchCount): Record<string, string> {
  const total = Object.values(counts).reduce((sum, value) => sum + value, 0);

  if (total === 0) {
    return {};
  }

  return Object.fromEntries(
    Object.entries(counts).map(([name, count]) => [
      name,
      ((count / total) * 100).toFixed(1),
    ]),
  );
}

export function analyzePixelData(
  pixelData: PixelDataLike,
  options: ColorAnalysisOptions,
): ColorAnalysisResult {
  const {
    clusterCount = DEFAULT_CLUSTER_COUNT,
    deltaMethod = "CIE2000",
    palette,
    pixelStep = DEFAULT_PIXEL_STEP,
  } = options;

  const rgbSamples = sampleRgbPixels(pixelData, pixelStep);

  if (rgbSamples.length === 0) {
    return EMPTY_ANALYSIS_RESULT;
  }

  const counts = countPaletteMatches(rgbSamples, palette, deltaMethod);

  return {
    counts,
    dominantColors: clusterRgbValues(rgbSamples, clusterCount),
    percentages: calculatePercentages(counts),
  };
}
