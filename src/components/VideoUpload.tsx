"use client";

import { useState, useEffect } from "react";
import { VideoIcon, X, Loader2 } from "lucide-react";

interface VideoUploadProps {
  onUpload: (url: string, type: string) => void;
  className?: string;
  currentVideo?: string;
}

interface VideoUploadResponse {
  url: string;
  type: string;
  message: string;
}

export function VideoUpload({
  onUpload,
  className = "",
  currentVideo,
}: VideoUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(currentVideo || null);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<number>(0);
  const [manualUrl, setManualUrl] = useState<string>(currentVideo || "");

  // Tisztítás komponens unmount esetén
  useEffect(() => {
    return () => {
      if (preview && !preview.startsWith("/uploads/")) {
        URL.revokeObjectURL(preview);
      }
    };
  }, [preview]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Fájl méret ellenőrzése (100MB)
    if (file.size > 100 * 1024 * 1024) {
      setError("A fájl mérete nem lehet nagyobb 100MB-nál");
      return;
    }

    // Fájl típus ellenőrzése
    if (!file.type.startsWith("video/")) {
      setError("Csak videófájlok tölthetők fel");
      return;
    }

    // Támogatott formátumok ellenőrzése
    const allowedTypes = ["video/mp4", "video/webm"];
    if (!allowedTypes.includes(file.type)) {
      setError("Csak MP4 vagy WebM formátumú videók tölthetők fel");
      return;
    }

    setError(null);
    setIsUploading(true);
    setProgress(0);

    // Lokális előnézet beállítása
    const videoURL = URL.createObjectURL(file);
    setPreview(videoURL);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Hiba történt a feltöltés során");
      }

      // Feltöltés befejezve, előnézeti URL felszabadítása
      URL.revokeObjectURL(videoURL);

      const data: VideoUploadResponse = await response.json();
      setPreview(data.url);
      setManualUrl(data.url);
      setProgress(100);
      // Automatikusan beállítjuk a videó típusát az URL alapján
      const videoType = data.url.toLowerCase().endsWith(".mp4")
        ? "mp4"
        : "webm";
      onUpload(data.url, videoType);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Hiba történt a feltöltés során"
      );
      console.error("Upload error:", err);
      if (preview) {
        URL.revokeObjectURL(videoURL);
        setPreview(null);
      }
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemove = () => {
    if (preview && !preview.startsWith("/uploads/")) {
      URL.revokeObjectURL(preview);
    }
    setPreview(null);
    setManualUrl("");
    onUpload("", "mp4");
  };

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const url = e.target.value;
    setManualUrl(url);
    setPreview(url);
    // Automatikusan beállítjuk a videó típusát az URL alapján
    const videoType = url.toLowerCase().endsWith(".mp4") ? "mp4" : "webm";
    onUpload(url, videoType);
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center space-x-4">
        <label className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500">
          <span className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
            <VideoIcon className="w-5 h-5 mr-2" />
            {isUploading ? "Feltöltés..." : "Videó feltöltése"}
          </span>
          <input
            type="file"
            className="sr-only"
            accept="video/mp4,video/webm"
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

      {/* Manuális URL bevitel */}
      <div>
        <label className="block text-sm font-medium mb-2">
          Videó URL
          <input
            type="text"
            value={manualUrl}
            onChange={handleUrlChange}
            placeholder="/uploads/filename.mp4"
            className="mt-1 block w-full rounded-md border border-gray-300 p-2"
          />
        </label>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {isUploading && (
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-sm text-gray-500">
              Feltöltés: {Math.round(progress)}%
            </span>
          </div>
          <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-600 transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {preview && (
        <div className="relative">
          <video
            src={preview}
            controls
            className="w-full rounded-lg shadow-md"
            playsInline
          >
            Az Ön böngészője nem támogatja a videó lejátszását.
          </video>
        </div>
      )}
    </div>
  );
}
