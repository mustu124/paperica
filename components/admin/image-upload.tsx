"use client";

import Image from "next/image";
import { ImagePlus, Trash2 } from "lucide-react";
import { useId, useState } from "react";
import { useToast } from "@/components/ui/toast";
import { uploadImage, type ImageFormat, type MediaFolder } from "@/lib/admin/image";
import { cn } from "@/lib/cn";

/** Single image field: thumbnail preview, upload (auto-resized to WebP), replace and remove. */
export function ImageUpload({
  value,
  onChange,
  folder,
  label = "Image",
  aspect = "aspect-[4/5]",
  contain = false,
  format,
  className,
}: {
  value: string | null;
  onChange: (url: string | null) => void;
  folder: MediaFolder;
  label?: string;
  aspect?: string;
  /** Show the whole image (logos) instead of cropping to fill the box. */
  contain?: boolean;
  format?: ImageFormat;
  className?: string;
}) {
  const id = useId();
  const [busy, setBusy] = useState(false);
  const { toast } = useToast();

  const onFile = async (file: File | undefined) => {
    if (!file) return;
    setBusy(true);
    try {
      onChange(await uploadImage(file, folder, format));
    } catch (e) {
      toast((e as Error).message, "error");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className={cn("flex flex-col gap-1.5 text-sm", className)}>
      <span className="font-medium">{label}</span>
      <div className={cn("relative w-full overflow-hidden rounded-md border border-dashed border-ink/25 bg-paper/40", aspect)}>
        {value ? (
          <Image src={value} alt="" fill sizes="240px" className={contain ? "object-contain p-2" : "object-cover"} />
        ) : (
          <span className="absolute inset-0 flex items-center justify-center text-xs text-ink-muted">No image</span>
        )}
        {busy && (
          <span className="absolute inset-0 flex items-center justify-center bg-white/70 text-xs font-medium">Uploading…</span>
        )}
      </div>
      <div className="flex gap-2">
        <label
          htmlFor={id}
          className="inline-flex min-h-11 flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-md border border-ink/25 bg-white px-3 text-xs font-medium lg:min-h-0 lg:py-2 hover:border-chilli hover:text-chilli"
        >
          <ImagePlus className="size-4" aria-hidden />
          {value ? "Replace" : "Upload"}
        </label>
        <input
          id={id}
          type="file"
          accept="image/*"
          className="sr-only"
          disabled={busy}
          onChange={(e) => {
            void onFile(e.target.files?.[0]);
            e.target.value = "";
          }}
        />
        {value && (
          <button
            type="button"
            onClick={() => onChange(null)}
            aria-label={`Remove ${label.toLowerCase()}`}
            className="inline-flex min-w-11 items-center justify-center rounded-md border border-ink/25 bg-white text-ink-muted hover:border-chilli hover:text-chilli lg:min-w-9"
          >
            <Trash2 className="size-4" aria-hidden />
          </button>
        )}
      </div>
    </div>
  );
}
