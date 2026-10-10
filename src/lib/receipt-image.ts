/**
 * Receipt images are stored as base64 data URLs inside one D1 `orders` row.
 * D1 caps a single string/row at 2,000,000 bytes, so the browser shrinks the
 * photo before upload. Keep RECEIPT_MAX_CHARS below that cap with headroom
 * for the other columns in the same row.
 */
export const RECEIPT_MAX_CHARS = 1_800_000;
const TARGET_CHARS = 1_500_000;
export const RECEIPT_INPUT_MAX_BYTES = 15 * 1024 * 1024;
export const RECEIPT_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"];

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("decode"));
    };
    image.src = url;
  });
}

/**
 * Re-encodes the receipt as JPEG, scaling the longest side down and lowering
 * quality until the data URL fits the server/D1 limit. Throws if the image
 * cannot be decoded or still does not fit after the smallest attempt.
 */
export async function compressReceipt(file: File): Promise<string> {
  const image = await loadImage(file);
  const sourceWidth = image.naturalWidth;
  const sourceHeight = image.naturalHeight;
  if (!sourceWidth || !sourceHeight) throw new Error("decode");

  for (const maxSide of [1600, 1200, 900]) {
    const scale = Math.min(1, maxSide / Math.max(sourceWidth, sourceHeight));
    const width = Math.max(1, Math.round(sourceWidth * scale));
    const height = Math.max(1, Math.round(sourceHeight * scale));
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("canvas");
    // White backdrop: transparent PNG receipts stay readable as JPEG.
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, width, height);
    context.drawImage(image, 0, 0, width, height);

    for (const quality of [0.85, 0.7, 0.55]) {
      const dataUrl = canvas.toDataURL("image/jpeg", quality);
      if (dataUrl.length <= TARGET_CHARS) return dataUrl;
    }
  }
  throw new Error("too-large");
}
