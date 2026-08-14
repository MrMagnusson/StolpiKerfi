// Client-side downscale (max 640px wide, JPEG q0.7) before upload — same treatment as the Vettvangur
// app's camera capture (apps/vettvangur/src/photo.ts), applied here to the unit detail page's
// condition photo slots so a full-resolution phone photo isn't uploaded as-is.
import { uploadPhoto } from "./api.js";

export function downscaleAndUpload(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error);
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("Ekki tókst að lesa mynd"));
      img.onload = () => {
        const scale = Math.min(1, 640 / img.width);
        const canvas = document.createElement("canvas");
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;
        const ctx = canvas.getContext("2d");
        if (!ctx) return reject(new Error("Canvas ekki studd"));
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        canvas.toBlob(
          (blob) => {
            if (!blob) return reject(new Error("Ekki tókst að vinna mynd"));
            uploadPhoto(blob).then(resolve).catch(reject);
          },
          "image/jpeg",
          0.7,
        );
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}
