import { SlideType } from "@prisma/client";

interface VideoData {
  type: SlideType;
  mediaUrl?: string;
  videoType?: string;
  autoPlay?: boolean;
  isLoop?: boolean;
  isMuted?: boolean;
}

interface SlideData {
  type: SlideType;
  title?: string;
  subtitle?: string;
  mediaUrl?: string;
  gradientFrom?: string;
  gradientTo?: string;
  videoType?: string;
  autoPlay?: boolean;
  isLoop?: boolean;
  isMuted?: boolean;
  ctaText?: string;
  ctaLink?: string;
  isActive?: boolean;
}

export function validateSlideData(data: SlideData) {
  // Alapvető mezők validálása
  if (!data.type) {
    throw new Error("A slide típusának megadása kötelező");
  }

  if (!data.title || data.title.trim() === "") {
    throw new Error("A cím megadása kötelező");
  }

  // Típus-specifikus validáció
  switch (data.type) {
    case "VIDEO":
      validateVideoData(data);
      break;
    case "IMAGE":
      if (!data.mediaUrl) {
        throw new Error("A kép URL megadása kötelező");
      }
      validateMediaUrl(data.mediaUrl, "IMAGE");
      break;
    case "GRADIENT":
      if (!data.gradientFrom || !data.gradientTo) {
        throw new Error(
          "A színátmenet kezdő és végpontjának megadása kötelező"
        );
      }
      validateGradientColors(data.gradientFrom, data.gradientTo);
      break;
  }

  // CTA validáció - ha van szöveg, kell link is és fordítva
  if ((data.ctaText && !data.ctaLink) || (!data.ctaText && data.ctaLink)) {
    throw new Error("A CTA szöveg és link csak együtt adható meg");
  }
}

export function validateVideoData(data: VideoData) {
  if (data.type === "VIDEO") {
    if (!data.mediaUrl) {
      throw new Error("A videó URL megadása kötelező");
    }

    if (!data.videoType || !["mp4", "webm"].includes(data.videoType)) {
      throw new Error("Érvényes videó típus (mp4 vagy webm) megadása kötelező");
    }

    validateMediaUrl(data.mediaUrl, "VIDEO");
  }
}

export function validateMediaUrl(
  url: string,
  type: "VIDEO" | "IMAGE" | SlideType
) {
  if (!url) return;

  try {
    const parsedUrl = new URL(url);

    if (type === "VIDEO") {
      if (!parsedUrl.pathname.match(/\.(mp4|webm)$/i)) {
        throw new Error(
          "A videó URL-nek .mp4 vagy .webm kiterjesztésűnek kell lennie"
        );
      }
    } else if (type === "IMAGE") {
      if (!parsedUrl.pathname.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
        throw new Error("A kép URL-nek megfelelő képformátumúnak kell lennie");
      }
    }
  } catch {
    throw new Error("Érvénytelen URL formátum");
  }
}

export function validateGradientColors(fromColor: string, toColor: string) {
  const colorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;

  if (!colorRegex.test(fromColor)) {
    throw new Error(
      "Érvénytelen kezdő szín formátum - használj hexadecimális színkódot (pl. #FF0000)"
    );
  }

  if (!colorRegex.test(toColor)) {
    throw new Error(
      "Érvénytelen záró szín formátum - használj hexadecimális színkódot (pl. #FF0000)"
    );
  }
}

export function prepareVideoData(data: any) {
  if (data.type === "VIDEO") {
    return {
      ...data,
      videoType: data.videoType || "mp4",
      autoPlay: Boolean(data.autoPlay),
      isLoop: Boolean(data.isLoop),
      isMuted: Boolean(data.isMuted),
    };
  }

  // Ha nem videó típus, akkor null értékek
  return {
    ...data,
    videoType: null,
    autoPlay: true,
    isLoop: true,
    isMuted: true,
  };
}
