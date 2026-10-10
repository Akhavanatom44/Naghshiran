"use client";

import { useState } from "react";

type ProductImageProps = {
  code: number;
  name: string;
  imageUrl?: string | null;
  className?: string;
  loading?: "eager" | "lazy";
  width?: number;
  height?: number;
};

/** Keep catalog and cart images visible when a saved/custom image URL is stale. */
export default function ProductImage({
  code,
  name,
  imageUrl,
  className,
  loading = "lazy",
  width = 640,
  height = 640,
}: ProductImageProps) {
  const fallback = `/images/catalog/${code}.svg`;
  const requested = imageUrl?.trim() || fallback;
  const [failedSource, setFailedSource] = useState<string | null>(null);
  const source = failedSource === requested ? fallback : requested;

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={source}
      alt={`تصویر ${name}`}
      loading={loading}
      decoding="async"
      width={width}
      height={height}
      onError={() => {
        if (source !== fallback) setFailedSource(requested);
      }}
      className={className}
    />
  );
}
