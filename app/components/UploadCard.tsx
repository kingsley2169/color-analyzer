import type { ChangeEvent, RefObject } from "react";
import { formatFileSize, type UploadDetails } from "@/lib/color-analyzer-ui";

type UploadCardProps = {
  errorMessage: string | null;
  fileInputRef: RefObject<HTMLInputElement | null>;
  imageSrc: string | null;
  isReadingFile: boolean;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onReset: () => void;
  uploadDetails: UploadDetails | null;
};

export function UploadCard({
  errorMessage,
  fileInputRef,
  imageSrc,
  isReadingFile,
  onChange,
  onReset,
  uploadDetails,
}: UploadCardProps) {
  const descriptionId = "upload-help";
  const errorId = "upload-error-message";
  const inputId = "upload-image-input";

  return (
    <section
      data-testid="upload-card"
      aria-labelledby="upload-card-title"
      className="rounded-3xl border border-white/10 bg-white/5 p-4 shadow-2xl shadow-black/20"
    >
      <div className="mb-3 flex items-center justify-between">
        <div>
          <h2 id="upload-card-title" className="text-sm font-semibold text-white">Upload</h2>
          <p id={descriptionId} className="text-xs text-neutral-400">JPG, PNG, WebP, GIF up to 15 MB</p>
        </div>
        {imageSrc && (
          <button
            type="button"
            onClick={onReset}
            aria-label="Reset the current uploaded image and analysis"
            className="cursor-pointer rounded-full border border-white/10 px-3 py-1 text-xs font-medium text-neutral-300 transition hover:border-white/20 hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
          >
            Reset
          </button>
        )}
      </div>

      <label
        htmlFor={inputId}
        className="block cursor-pointer rounded-2xl border border-dashed border-white/15 bg-black/20 p-4 transition hover:border-cyan-300/40 hover:bg-black/30 focus-within:border-cyan-300/50"
      >
        <input
          data-testid="upload-input"
          id={inputId}
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={onChange}
          aria-describedby={errorMessage ? `${descriptionId} ${errorId}` : descriptionId}
          className="sr-only"
        />
        <span className="block text-sm font-medium text-white">
          {isReadingFile ? "Reading image..." : "Choose an image"}
        </span>
        <span className="mt-1 block text-xs leading-5 text-neutral-400">
          {uploadDetails
            ? `${uploadDetails.fileName} • ${formatFileSize(uploadDetails.fileSize)}`
            : "The analysis happens locally in your browser."}
        </span>
      </label>

      {errorMessage && (
        <div
          data-testid="upload-error"
          id={errorId}
          role="alert"
          className="mt-3 rounded-2xl border border-rose-400/25 bg-rose-500/10 px-3 py-2 text-sm text-rose-100"
        >
          {errorMessage}
        </div>
      )}
    </section>
  );
}
