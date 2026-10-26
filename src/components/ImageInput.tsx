/**
 * ImageInput — drag & drop image upload component.
 */

import { useState, useRef } from 'react';
import { Image, X, Upload } from 'lucide-react';
import { fileToImageAttachment, validateImageFile, type ImageAttachment } from '../lib/image-input';

interface ImageInputProps {
  images: ImageAttachment[];
  onImagesChange: (images: ImageAttachment[]) => void;
}

export default function ImageInput({ images, onImagesChange }: ImageInputProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = async (files: FileList | File[]) => {
    setError(null);
    const newImages: ImageAttachment[] = [];

    for (const file of Array.from(files)) {
      const validation = validateImageFile(file);
      if (!validation.valid) {
        setError(validation.error || 'Invalid file');
        continue;
      }

      try {
        const attachment = await fileToImageAttachment(file);
        newImages.push(attachment);
      } catch (e) {
        setError('Failed to read file');
      }
    }

    if (newImages.length > 0) {
      onImagesChange([...images, ...newImages]);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const removeImage = (id: string) => {
    onImagesChange(images.filter(img => img.id !== id));
  };

  return (
    <div className="space-y-2">
      {/* Image previews */}
      {images.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {images.map(img => (
            <div key={img.id} className="relative group">
              <img
                src={img.dataUrl}
                alt={img.name}
                className="w-16 h-16 object-cover rounded-lg border"
                style={{ borderColor: 'var(--border)' }}
              />
              <button
                onClick={() => removeImage(img.id)}
                className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X size={12} />
              </button>
              <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-[10px] px-1 py-0.5 rounded-b-lg truncate">
                {img.name}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Drop zone / upload button */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-lg p-3 text-center cursor-pointer transition-colors ${
          isDragging ? 'border-brand-500 bg-brand-500/10' : 'border-gray-300 hover:border-brand-500'
        }`}
        style={{ borderColor: isDragging ? undefined : 'var(--border)' }}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={e => e.target.files && handleFiles(e.target.files)}
          className="hidden"
        />
        <div className="flex items-center justify-center gap-2 text-sm" style={{ color: 'var(--text-muted)' }}>
          <Upload size={16} />
          <span>Drop images here or click to upload</span>
        </div>
      </div>

      {error && (
        <p className="text-xs text-red-500">{error}</p>
      )}
    </div>
  );
}
