"use client";

import React, { useState, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Slide } from "@prisma/client";
import Link from "next/link";

interface HeroSliderProps {
  slides: Slide[];
  autoSlideInterval?: number;
}

export default function HeroSlider({
  slides,
  autoSlideInterval = 5000,
}: HeroSliderProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  useEffect(() => {
    if (!isPaused) {
      const timer = setInterval(() => {
        if (!isTransitioning) {
          handleNext();
        }
      }, autoSlideInterval);

      return () => clearInterval(timer);
    }
  }, [currentIndex, isTransitioning, isPaused, autoSlideInterval]);

  useEffect(() => {
    slides.forEach((slide) => {
      if (slide.type === "IMAGE" && slide.mediaUrl) {
        const img = new Image();
        img.src = slide.mediaUrl;
      }
    });
  }, [slides]);

  const handleNext = useCallback(() => {
    if (!isTransitioning) {
      setIsTransitioning(true);
      setCurrentIndex((current) => (current + 1) % slides.length);
      setTimeout(() => setIsTransitioning(false), 750);
    }
  }, [slides.length, isTransitioning]);

  const handlePrev = useCallback(() => {
    if (!isTransitioning) {
      setIsTransitioning(true);
      setCurrentIndex(
        (current) => (current - 1 + slides.length) % slides.length
      );
      setTimeout(() => setIsTransitioning(false), 750);
    }
  }, [slides.length, isTransitioning]);

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.touches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.touches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe) {
      handleNext();
    } else if (isRightSwipe) {
      handlePrev();
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") {
        handlePrev();
      } else if (e.key === "ArrowRight") {
        handleNext();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleNext, handlePrev]);

  const renderSlideContent = (slide: Slide, isActive: boolean) => {
    const commonClasses = `absolute inset-0 transition-opacity duration-750 ${
      isActive ? "opacity-100" : "opacity-0 pointer-events-none"
    }`;

    return (
      <div key={slide.id} className={commonClasses}>
        {/* Háttér */}
        {slide.type === "GRADIENT" ? (
          <div
            className="absolute inset-0 bg-gradient-to-r"
            style={{
              backgroundImage: `linear-gradient(to right, ${slide.gradientFrom}, ${slide.gradientTo})`,
            }}
          >
            <div className="absolute inset-0 bg-grid-white/[0.1] bg-[size:20px_20px]" />
          </div>
        ) : slide.type === "IMAGE" ? (
          <div className="absolute inset-0">
            <div
              className="absolute inset-0 bg-cover bg-center transition-transform duration-[2000ms] hover:scale-105"
              style={{
                backgroundImage: `url(${slide.mediaUrl})`,
                transform: isActive ? "scale(1.0)" : "scale(1.1)",
              }}
            />
            <div className="absolute inset-0 bg-black/50 backdrop-brightness-75" />
          </div>
        ) : null}

        {/* Tartalom */}
        <div className="relative h-full flex flex-col justify-center items-center text-center px-4 md:px-8 max-w-7xl mx-auto">
          <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold text-white mb-3 md:mb-4 max-w-4xl text-balance drop-shadow-lg">
            {slide.title}
          </h1>
          {slide.subtitle && (
            <p className="text-base md:text-lg lg:text-xl text-white/90 max-w-2xl mb-6 text-balance drop-shadow-md">
              {slide.subtitle}
            </p>
          )}
          {slide.ctaText && (
            <Link
              href={slide.ctaLink || "#"}
              className="px-5 py-2.5 md:px-6 md:py-3 text-base md:text-lg font-medium rounded-full bg-white hover:bg-white/90 text-blue-600 hover:text-blue-700 transition-all duration-300 shadow-lg hover:shadow-xl"
            >
              {slide.ctaText}
            </Link>
          )}
        </div>
      </div>
    );
  };

  if (slides.length === 0) {
    return null;
  }

  return (
    <div
      className="relative w-full aspect-[21/9] max-h-[60vh] overflow-hidden bg-gray-900 group"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Slideok konténer */}
      <div
        className="relative w-full h-full"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {slides.map((slide, index) =>
          renderSlideContent(slide, index === currentIndex)
        )}
      </div>

      {/* Navigációs gombok */}
      <div className="absolute inset-x-4 top-1/2 -translate-y-1/2 flex justify-between pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <button
          onClick={handlePrev}
          className="pointer-events-auto p-2 rounded-full bg-black/20 hover:bg-black/40 text-white transition-all duration-300 backdrop-blur-sm transform hover:scale-110"
          aria-label="Előző slide"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <button
          onClick={handleNext}
          className="pointer-events-auto p-2 rounded-full bg-black/20 hover:bg-black/40 text-white transition-all duration-300 backdrop-blur-sm transform hover:scale-110"
          aria-label="Következő slide"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Slide indikátorok */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex space-x-1.5">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => {
              if (!isTransitioning) {
                setIsTransitioning(true);
                setCurrentIndex(index);
                setTimeout(() => setIsTransitioning(false), 750);
              }
            }}
            className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
              index === currentIndex
                ? "w-4 bg-white"
                : "bg-white/50 hover:bg-white/70"
            }`}
            aria-label={`${index + 1}. slide`}
          />
        ))}
      </div>
    </div>
  );
}
