import type { ReactNode } from "react";
import { formatFileSize, type UploadDetails } from "@/lib/color-analyzer-ui";
import { DeltaMethodKey } from "@/lib/color-analysis";

type SessionInfoCardProps = {
  deltaMethod: DeltaMethodKey;
  uploadDetails: UploadDetails | null;
};

export function SessionInfoCard({
  deltaMethod,
  uploadDetails,
}: SessionInfoCardProps) {
  return (
    <section className="rounded-[1.75rem] border border-white/10 bg-white/5 p-4 shadow-2xl shadow-black/20">
      <div className="mb-4">
        <h2 className="text-sm font-semibold text-white">Session info</h2>
        <p className="text-xs text-neutral-400">
          Quick context for the current upload and analysis run.
        </p>
      </div>

      <div className="space-y-3">
        <InfoBlock label="File" value={uploadDetails?.fileName ?? "No file selected"}>
          {uploadDetails && `${formatFileSize(uploadDetails.fileSize)} • ${uploadDetails.fileType}`}
        </InfoBlock>
        <InfoBlock label="Active formula" value={deltaMethod} />
        <InfoBlock label="Interaction" value="Hover on desktop, tap on mobile">
          Inspect a point on the image to reveal the nearest named color.
        </InfoBlock>
        <InfoBlock label="Powered by" value="@a.r.i_eze/color-matcher" />

      </div>
    </section>
  );
}

function InfoBlock({
  children,
  label,
  value,
}: {
  children?: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
      <div className="text-[11px] uppercase tracking-[0.18em] text-neutral-500">{label}</div>
      <div className="mt-1 text-sm font-medium text-white">{value}</div>
      {children && <div className="mt-1 text-xs text-neutral-400">{children}</div>}
    </div>
  );
}
