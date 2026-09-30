import type { DiaryImage } from "@/types/diary";

const MAX_IMAGE_EDGE = 1400;
const IMAGE_QUALITY = 0.72;

export async function compressDiaryImages(images: DiaryImage[]) {
  return Promise.all(
    images.map(async (image) => ({
      ...image,
      dataUrl: await compressImageDataUrl(image.dataUrl)
    }))
  );
}

export function compressImageDataUrl(dataUrl: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const image = new window.Image();
    image.onload = () => {
      const scale = Math.min(1, MAX_IMAGE_EDGE / Math.max(image.width, image.height));
      const width = Math.max(1, Math.round(image.width * scale));
      const height = Math.max(1, Math.round(image.height * scale));
      const canvas = document.createElement("canvas");
      const context = canvas.getContext("2d");

      if (!context) {
        reject(new Error("Could not prepare photo"));
        return;
      }

      canvas.width = width;
      canvas.height = height;
      context.drawImage(image, 0, 0, width, height);
      resolve(canvas.toDataURL("image/jpeg", IMAGE_QUALITY));
    };
    image.onerror = () => reject(new Error("Could not read photo"));
    image.src = dataUrl;
  });
}
