function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(img);
    };
    img.onerror = reject;
    img.src = objectUrl;
  });
}

function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("Unable to convert canvas to blob."));
          return;
        }
        resolve(blob);
      },
      type,
      quality
    );
  });
}

export async function compressImage(file: File, maxWidth = 1800, quality = 0.82): Promise<File> {
  if (!file.type.startsWith("image/")) {
    return file;
  }

  const image = await loadImage(file);
  const ratio = Math.min(1, maxWidth / image.width);
  const width = Math.floor(image.width * ratio);
  const height = Math.floor(image.height * ratio);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    return file;
  }
  ctx.drawImage(image, 0, 0, width, height);

  const blob = await canvasToBlob(canvas, "image/webp", quality);
  return new File([blob], `${file.name.split(".")[0]}.webp`, { type: "image/webp" });
}

export async function createThumbnail(file: File, size = 480): Promise<File> {
  if (!file.type.startsWith("image/")) {
    return file;
  }

  const image = await loadImage(file);
  const ratio = Math.min(size / image.width, size / image.height);
  const width = Math.floor(image.width * ratio);
  const height = Math.floor(image.height * ratio);

  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    return file;
  }

  ctx.fillStyle = "#f1f5f9";
  ctx.fillRect(0, 0, size, size);
  const offsetX = Math.floor((size - width) / 2);
  const offsetY = Math.floor((size - height) / 2);
  ctx.drawImage(image, offsetX, offsetY, width, height);

  const blob = await canvasToBlob(canvas, "image/webp", 0.75);
  return new File([blob], `${file.name.split(".")[0]}-thumb.webp`, { type: "image/webp" });
}

export function formatBytes(bytes: number | null): string {
  if (!bytes) return "0 B";
  const unit = ["B", "KB", "MB", "GB"];
  let size = bytes;
  let i = 0;
  while (size >= 1024 && i < unit.length - 1) {
    size /= 1024;
    i += 1;
  }
  return `${size.toFixed(1)} ${unit[i]}`;
}
