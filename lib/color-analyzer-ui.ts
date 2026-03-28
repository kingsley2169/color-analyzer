import type { RGB } from "@a.r.i_eze/color-matcher";

export type UploadDetails = {
  fileName: string;
  fileSize: number;
  fileType: string;
};

export function formatFileSize(bytes: number): string {
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function formatRgb(color: RGB): string {
  return `${color.r}, ${color.g}, ${color.b}`;
}

export function rgbToHex(color: RGB): string {
  return `#${[color.r, color.g, color.b]
    .map((value) => value.toString(16).padStart(2, "0"))
    .join("")
    .toUpperCase()}`;
}
