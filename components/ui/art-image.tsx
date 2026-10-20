import Image, { getImageProps } from "next/image";

/** Phones get the mobile image (when one is set); everything wider gets the laptop image. */
export const MOBILE_MEDIA = "(max-width: 767px)";

type Props = {
  src: string;
  /** Optional phone version (art direction). Falls back to `src`. */
  mobileSrc?: string | null;
  alt: string;
  /** Laptop/tablet sizes hint. */
  sizes: string;
  /** Phone sizes hint for the mobile image. */
  mobileSizes?: string;
  priority?: boolean;
  loading?: "eager" | "lazy";
  fetchPriority?: "high" | "low" | "auto";
  className?: string;
  "aria-hidden"?: boolean;
};

/**
 * `fill` image with an optional separate phone image. With a phone image it renders a
 * <picture>, so each device downloads only its own version (both still optimised by next/image).
 */
export function ArtImage({ src, mobileSrc, alt, sizes, mobileSizes = "100vw", className, ...rest }: Props) {
  if (!mobileSrc || mobileSrc === src) {
    return <Image src={src} alt={alt} fill sizes={sizes} className={className} {...rest} />;
  }
  const common = { alt, fill: true, ...rest };
  const { props: mobileProps } = getImageProps({ ...common, src: mobileSrc, sizes: mobileSizes });
  // Unoptimised files (e.g. SVG) get no srcSet, only a src.
  const mobileSrcSet = mobileProps.srcSet || mobileProps.src;
  const { props: desktop } = getImageProps({ ...common, src, sizes });
  return (
    <picture>
      <source media={MOBILE_MEDIA} srcSet={mobileSrcSet} sizes={mobileSizes} />
      {/* eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text -- props (incl. alt) come from getImageProps */}
      <img {...desktop} className={className} />
    </picture>
  );
}
