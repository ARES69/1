/**
 * Image input — support for uploading images/screenshots to prompts.
 * Converts images to base64 for inclusion in multimodal LLM requests.
 */

export interface ImageAttachment {
  id: string;
  name: string;
  type: string;
  dataUrl: string;
  size: number;
}

export async function fileToImageAttachment(file: File): Promise<ImageAttachment> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      resolve({
        id: 'img-' + Date.now() + '-' + Math.random().toString(36).slice(2, 8),
        name: file.name,
        type: file.type,
        dataUrl: reader.result as string,
        size: file.size,
      });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function validateImageFile(file: File): { valid: boolean; error?: string } {
  const maxSize = 5 * 1024 * 1024; // 5MB
  const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp'];
  
  if (file.size > maxSize) {
    return { valid: false, error: 'Image must be less than 5MB' };
  }
  if (!allowedTypes.includes(file.type)) {
    return { valid: false, error: 'Only PNG, JPEG, GIF, and WebP images are supported' };
  }
  return { valid: true };
}

export function formatImageForPrompt(images: ImageAttachment[]): string {
  if (images.length === 0) return '';
  
  const imageDescriptions = images.map((img, i) => {
    return `[Image ${i + 1}: ${img.name} (${(img.size / 1024).toFixed(1)}KB)]`;
  }).join('\n');
  
  return `\n\nAttached images:\n${imageDescriptions}\n\nNote: Images are included as base64 in the API request.`;
}

export function convertImagesToAPIMessage(images: ImageAttachment[]): any {
  if (images.length === 0) return null;
  
  // OpenAI format
  return {
    role: 'user',
    content: [
      ...images.map(img => ({
        type: 'image_url',
        image_url: {
          url: img.dataUrl,
          detail: 'auto',
        },
      })),
    ],
  };
}
