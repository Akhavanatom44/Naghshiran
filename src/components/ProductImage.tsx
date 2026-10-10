"use client";

import { useState } from "react";
import { CATALOG_PLACEHOLDER_IMAGE, catalogImageUrl } from "@/data/catalog";

type ProductImageProps = {
  code: number;
  name: string;
  imageUrl?: string | null;
  className?: string;
  loading?: "eager" | "lazy";
  width?: number;
  height?: number;
};

/** Try the local catalog photo before its illustration when a saved URL is stale. */
export default function ProductImage({
  code,
  name,
  imageUrl,
  className,
  loading = "lazy",
  width = 640,
  height = 640,
}: ProductImageProps) {
  const catalogSource = catalogImageUrl(code);
  const illustration = `/images/catalog/${code}.svg`;
  const requested = imageUrl?.trim() || catalogSource;
  // A stale custom URL must never leave a broken image icon in a product
  // card. The final local placeholder also covers new DB products that do not
  // have a code-specific asset yet.
  const sources = [
    ...new Set([requested, catalogSource, illustration, CATALOG_PLACEHOLDER_IMAGE]),
  ];
  const [failedSources, setFailedSources] = useState<string[]>([]);
  const source =
    sources.find((candidate) => !failedSources.includes(candidate)) ?? illustration;

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
        setFailedSources((previous) =>
          previous.includes(source) ? previous : [...previous, source],
        );
      }}
      className={className}
    />
  );
}
