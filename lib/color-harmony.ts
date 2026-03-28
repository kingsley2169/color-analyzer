import {
  deltaE2000,
  rgbToLab,
} from "@a.r.i_eze/color-matcher";
import type { ColorWithLab, RGB } from "@a.r.i_eze/color-matcher";
import { rgbToHex } from "@/lib/color-analyzer-ui";

export type HarmonyKind = "Analogous" | "Complementary" | "Triadic";
export type HarmonyMode = HarmonyKind | "All";

export type HarmonySuggestion = {
  baseHex: string;
  baseRgb: RGB;
  baseSwatchIndex: number;
  hex: string;
  kind: HarmonyKind;
  matchedHex: string;
  matchedName: string;
  rgb: RGB;
  wasBoosted: boolean;
};

type Hsl = {
  h: number;
  l: number;
  s: number;
};

export function generateHarmonySuggestions(
  dominantColors: RGB[],
  palette: ColorWithLab[],
): HarmonySuggestion[] {
  const suggestions: HarmonySuggestion[] = [];

  dominantColors.slice(0, 3).forEach((color, index) => {
    const normalizedBase = normalizeHarmonyBase(rgbToHsl(color));
    const baseHsl = normalizedBase.hsl;
    const harmonyVariants: Array<{ kind: HarmonyKind; rgb: RGB }> = [
      { kind: "Complementary", rgb: hslToRgb({ ...baseHsl, h: rotateHue(baseHsl.h, 180) }) },
      { kind: "Analogous", rgb: hslToRgb({ ...baseHsl, h: rotateHue(baseHsl.h, 30) }) },
      { kind: "Triadic", rgb: hslToRgb({ ...baseHsl, h: rotateHue(baseHsl.h, 120) }) },
    ];
    const usedMatches = new Set<string>();

    harmonyVariants.forEach(({ kind, rgb }) => {
      const closest = findDistinctPaletteMatch(rgb, palette, usedMatches);

      suggestions.push({
        baseHex: rgbToHex(color),
        baseRgb: color,
        baseSwatchIndex: index + 1,
        hex: rgbToHex(rgb),
        kind,
        matchedHex: closest?.hex ?? rgbToHex(rgb),
        matchedName: closest?.name ?? "Unmatched",
        rgb,
        wasBoosted: normalizedBase.wasBoosted,
      });
    });
  });

  return suggestions;
}

function findDistinctPaletteMatch(
  rgb: RGB,
  palette: ColorWithLab[],
  usedMatches: Set<string>,
): ColorWithLab | null {
  const sampleLab = rgbToLab(rgb);
  const rankedMatches = palette
    .map((color) => ({
      color,
      distance: deltaE2000(sampleLab, color.lab),
    }))
    .sort((left, right) => left.distance - right.distance);

  const distinctMatch = rankedMatches.find(
    ({ color }) => !usedMatches.has(`${color.name}-${color.hex}`),
  )?.color;

  const resolvedMatch = distinctMatch ?? rankedMatches[0]?.color ?? null;

  if (resolvedMatch) {
    usedMatches.add(`${resolvedMatch.name}-${resolvedMatch.hex}`);
  }

  return resolvedMatch;
}

function rotateHue(hue: number, amount: number): number {
  return (hue + amount + 360) % 360;
}

function normalizeHarmonyBase(hsl: Hsl): { hsl: Hsl; wasBoosted: boolean } {
  if (hsl.s < 0.18) {
    return {
      hsl: {
        ...hsl,
        l: clamp(hsl.l, 0.32, 0.68),
        s: 0.45,
      },
      wasBoosted: true,
    };
  }

  return {
    hsl: {
      ...hsl,
      l: clamp(hsl.l, 0.28, 0.72),
      s: Math.max(hsl.s, 0.35),
    },
    wasBoosted: false,
  };
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function rgbToHsl({ b, g, r }: RGB): Hsl {
  const red = r / 255;
  const green = g / 255;
  const blue = b / 255;

  const max = Math.max(red, green, blue);
  const min = Math.min(red, green, blue);
  const lightness = (max + min) / 2;
  const delta = max - min;

  if (delta === 0) {
    return { h: 0, s: 0, l: lightness };
  }

  const saturation =
    lightness > 0.5 ? delta / (2 - max - min) : delta / (max + min);

  let hue = 0;
  if (max === red) {
    hue = (green - blue) / delta + (green < blue ? 6 : 0);
  } else if (max === green) {
    hue = (blue - red) / delta + 2;
  } else {
    hue = (red - green) / delta + 4;
  }

  return {
    h: hue * 60,
    l: lightness,
    s: saturation,
  };
}

function hslToRgb({ h, l, s }: Hsl): RGB {
  if (s === 0) {
    const value = Math.round(l * 255);
    return { r: value, g: value, b: value };
  }

  const chroma = (1 - Math.abs(2 * l - 1)) * s;
  const hueSegment = h / 60;
  const x = chroma * (1 - Math.abs((hueSegment % 2) - 1));

  let red = 0;
  let green = 0;
  let blue = 0;

  if (hueSegment >= 0 && hueSegment < 1) {
    red = chroma;
    green = x;
  } else if (hueSegment < 2) {
    red = x;
    green = chroma;
  } else if (hueSegment < 3) {
    green = chroma;
    blue = x;
  } else if (hueSegment < 4) {
    green = x;
    blue = chroma;
  } else if (hueSegment < 5) {
    red = x;
    blue = chroma;
  } else {
    red = chroma;
    blue = x;
  }

  const match = l - chroma / 2;

  return {
    r: Math.round((red + match) * 255),
    g: Math.round((green + match) * 255),
    b: Math.round((blue + match) * 255),
  };
}
