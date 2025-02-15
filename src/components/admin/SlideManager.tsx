"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Image,
  Video,
  Palette,
  X,
  Loader2,
  MoveUp,
  MoveDown,
  Save,
} from "lucide-react";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";

interface Slide {
  id: string;
  type: "GRADIENT" | "IMAGE" | "VIDEO";
  title: string;
  subtitle?: string | null;
  order: number;
  isActive: boolean;
  gradientFrom?: string | null;
  gradientTo?: string | null;
  mediaUrl?: string | null;
  ctaText?: string | null;
  ctaLink?: string | null;
  videoType?: string | null;
  autoPlay: boolean;
  isLoop: boolean;
  isMuted: boolean;
}

interface SlideManagerProps {
  slides: Slide[];
  onUpdate: (slides: Slide[]) => void;
}

export function SlideManager({ slides, onUpdate }: SlideManagerProps) {
  const [mounted, setMounted] = useState(false);
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  const handleSave = async () => {
    try {
      setIsSaving(true);
      await fetch("/api/slides", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(slides),
      });
      toast.success("Slideok sikeresen mentve!");
    } catch (error) {
      console.error("Hiba történt a mentés során:", error);
      toast.error("Hiba történt a mentés során!");
    } finally {
      setIsSaving(false);
    }
  };

  const handleImageUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    slideId: string
  ) => {
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
    setUploadingId(slideId);

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

      const data = await response.json();
      console.log("Upload response:", data); // Debug log

      // Frissítjük a slide képét
      const updatedSlides = slides.map((slide) =>
        slide.id === slideId ? { ...slide, mediaUrl: data.url } : slide
      );

      onUpdate(updatedSlides);
      toast.success("Kép sikeresen feltöltve!");
    } catch (err) {
      console.error("Upload error:", err); // Debug log
      setError(
        err instanceof Error ? err.message : "Hiba történt a feltöltés során"
      );
      toast.error("Hiba történt a kép feltöltése során!");
    } finally {
      setUploadingId(null);
    }
  };

  // ... (a többi kód változatlan marad)

  return (
    <div className="space-y-4">
      {/* Mentés gomb */}
      <div className="flex justify-end">
        <Button
          onClick={handleSave}
          disabled={isSaving}
          className="flex items-center gap-2"
        >
          {isSaving ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          {isSaving ? "Mentés..." : "Mentés"}
        </Button>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-3 rounded-md">{error}</div>
      )}

      {/* ... (a többi JSX kód változatlan marad) */}
    </div>
  );
}
