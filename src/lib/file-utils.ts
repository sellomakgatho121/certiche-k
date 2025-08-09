export const fileToDataUri = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      resolve(reader.result as string);
    };
    reader.onerror = (error) => {
      reject(error);
    };
    reader.readAsDataURL(file);
  });
};

export async function fileToOptimizedDataUri(
  file: File,
  options: { maxDimension?: number; quality?: number } = {}
): Promise<string> {
  const { maxDimension = 2000, quality = 0.9 } = options;

  if (!file.type.startsWith('image/')) {
    return fileToDataUri(file);
  }

  const imageUrl = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = (e) => reject(e);
      image.src = imageUrl;
    });

    const { width, height } = img;
    const scale = Math.min(1, maxDimension / Math.max(width, height));

    if (scale === 1) {
      URL.revokeObjectURL(imageUrl);
      return fileToDataUri(file);
    }

    const canvas = document.createElement('canvas');
    canvas.width = Math.round(width * scale);
    canvas.height = Math.round(height * scale);
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      URL.revokeObjectURL(imageUrl);
      return fileToDataUri(file);
    }
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    const mime = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
    const dataUrl = canvas.toDataURL(mime, quality);
    URL.revokeObjectURL(imageUrl);
    return dataUrl;
  } catch (_) {
    URL.revokeObjectURL(imageUrl);
    return fileToDataUri(file);
  }
}
