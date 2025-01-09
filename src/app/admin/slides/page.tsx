"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Edit,
  Trash2,
  PlusCircle,
  Eye,
  EyeOff,
  GripVertical,
} from "lucide-react";
import { Slide } from "@prisma/client";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";

export default function SlidesAdminPage() {
  const [slides, setSlides] = useState<Slide[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchSlides();
  }, []);

  const fetchSlides = async () => {
    try {
      const response = await fetch("/api/slides");
      if (!response.ok) throw new Error("Hiba történt a slideok betöltésekor");
      const data = await response.json();
      setSlides(data.sort((a: Slide, b: Slide) => a.order - b.order));
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ismeretlen hiba történt");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDragEnd = async (result: any) => {
    if (!result.destination) return;

    const items = Array.from(slides);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    // Frissítjük a lokális state-et azonnal a jobb UX érdekében
    setSlides(items);

    // Frissítjük a sorrendeket a szerveren
    try {
      const updatedItems = items.map((item, index) => ({
        ...item,
        order: index,
      }));

      const response = await fetch(`/api/slides/${reorderedItem.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order: result.destination.index }),
      });

      if (!response.ok) throw new Error("Hiba a sorrend módosításakor");

      // Újratöltjük a slideokat a szerverről
      await fetchSlides();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ismeretlen hiba történt");
      // Hiba esetén visszaállítjuk az eredeti sorrendet
      await fetchSlides();
    }
  };

  const toggleSlideStatus = async (id: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/slides/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !currentStatus }),
      });

      if (!response.ok) throw new Error("Hiba a státusz módosításakor");
      await fetchSlides();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ismeretlen hiba történt");
    }
  };

  const deleteSlide = async (id: string) => {
    if (!window.confirm("Biztosan törölni szeretné ezt a slide-ot?")) return;

    try {
      const response = await fetch(`/api/slides/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Hiba a slide törlésekor");
      await fetchSlides();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ismeretlen hiba történt");
    }
  };

  if (isLoading) return <div className="p-4">Betöltés...</div>;

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Slideok kezelése</h1>
        <Link
          href="/admin/slides/new"
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          <PlusCircle className="w-5 h-5 mr-2" />
          Új slide
        </Link>
      </div>

      {error && (
        <div className="bg-red-50 text-red-500 p-4 rounded-md mb-4">
          {error}
        </div>
      )}

      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="slides">
          {(provided) => (
            <div
              {...provided.droppableProps}
              ref={provided.innerRef}
              className="grid gap-4"
            >
              {slides.map((slide, index) => (
                <Draggable key={slide.id} draggableId={slide.id} index={index}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      className={`bg-white dark:bg-gray-800 p-4 rounded-lg shadow flex flex-col md:flex-row justify-between items-start md:items-center gap-4 ${
                        snapshot.isDragging
                          ? "shadow-lg ring-2 ring-blue-500"
                          : ""
                      }`}
                    >
                      <div
                        {...provided.dragHandleProps}
                        className="cursor-move p-2 text-gray-400 hover:text-gray-600"
                      >
                        <GripVertical className="w-5 h-5" />
                      </div>

                      <div className="flex-1">
                        <h3 className="font-semibold text-lg">{slide.title}</h3>
                        <p className="text-gray-600 dark:text-gray-300 text-sm">
                          {slide.subtitle}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <div
                            className="w-4 h-4 rounded"
                            style={{
                              background: `linear-gradient(to right, ${slide.gradientFrom}, ${slide.gradientTo})`,
                            }}
                          />
                          <span className="text-sm text-gray-500">
                            {slide.gradientFrom} → {slide.gradientTo}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() =>
                            toggleSlideStatus(slide.id, slide.isActive)
                          }
                          className={`p-2 ${
                            slide.isActive ? "text-green-600" : "text-gray-400"
                          } hover:text-blue-600`}
                          title={slide.isActive ? "Aktív" : "Inaktív"}
                        >
                          {slide.isActive ? (
                            <Eye className="w-5 h-5" />
                          ) : (
                            <EyeOff className="w-5 h-5" />
                          )}
                        </button>
                        <Link
                          href={`/admin/slides/${slide.id}/edit`}
                          className="p-2 text-gray-600 hover:text-blue-600"
                          title="Szerkesztés"
                        >
                          <Edit className="w-5 h-5" />
                        </Link>
                        <button
                          onClick={() => deleteSlide(slide.id)}
                          className="p-2 text-gray-600 hover:text-red-600"
                          title="Törlés"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>
    </div>
  );
}
