// src/components/ImageUpload.tsx
"use client";

import { useState } from "react";
import { ImageIcon, X } from "lucide-react";

interface ImageUploadProps {
  onUpload: (url: string) => void;
  className?: string;
  currentImage?: string;
}

export function ImageUpload({
  onUpload,
  className = "",
  currentImage,
}: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(currentImage || null);
  const [error, setError] = useState<string | null>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Fájl méret ellenőrzése (5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError("A fájl mérete nem lehet nagyobb 5MB-nál");
      return;
    }

    // Fájl típus ellenőrzése
    if (!file.type.startsWith("image/")) {
      setError("Csak képfájlok tölthetők fel");
      return;
    }

    setError(null);
    setIsUploading(true);

    // Előnézeti kép beállítása
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    // Fájl feltöltése
    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Hiba történt a feltöltés során");
      }

      const data = await response.json();
      onUpload(data.url);
    } catch (err) {
      setError("Hiba történt a feltöltés során");
      console.error("Upload error:", err);
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemove = () => {
    setPreview(null);
    onUpload("");
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center space-x-4">
        <label className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500">
          <span className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
            <ImageIcon className="w-5 h-5 mr-2" />
            {isUploading ? "Feltöltés..." : "Kép feltöltése"}
          </span>
          <input
            type="file"
            className="sr-only"
            accept="image/*"
            onChange={handleUpload}
            disabled={isUploading}
          />
        </label>

        {preview && (
          <button
            type="button"
            onClick={handleRemove}
            className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-red-600 bg-white hover:bg-gray-50"
          >
            <X className="w-4 h-4 mr-1" />
            Eltávolítás
          </button>
        )}
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {preview && (
        <div className="relative">
          <img
            src={preview}
            alt="Preview"
            className="max-w-md rounded-lg shadow-md"
          />
        </div>
      )}
    </div>
  );
}
