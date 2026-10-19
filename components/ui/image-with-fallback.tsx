"use client";

import Image, { type ImageProps } from "next/image";
import { useState } from "react";
import { cn } from "@/lib/cn";

/**
 * next/image that swaps to a branded blush panel if the image is missing or fails to load.
 * Use with `fill` inside a sized, relatively-positioned parent, or with width/height.
 */
export function ImageWithFallback({
  src,
  alt,
  className,
  ...props
}: Omit<ImageProps, "src"> & { src?: ImageProps["src"] | null }) {
  const [failedSrc, setFailedSrc] = useState<ImageProps["src"] | null>(null);

  if (!src || failedSrc === src) {
    return (
      <div
        role="img"
        aria-label={alt}
        className={cn(
          "flex items-center justify-center bg-blush text-chilli",
          props.fill ? "absolute inset-0" : "",
          className,
        )}
        style={
          props.fill
            ? undefined
            : { width: Number(props.width) || undefined, height: Number(props.height) || undefined }
        }
      >
        <span className="font-display text-lg opacity-60">Paperica</span>
      </div>
    );
  }

  return (
    <Image src={src} alt={alt} className={className} onError={() => setFailedSrc(src)} {...props} />
  );
}
