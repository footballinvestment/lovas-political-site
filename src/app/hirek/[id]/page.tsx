"use client";
import { useState, useEffect } from "react";
import { Loader2, Calendar, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function HirReszletek({ params }: { params: { id: string } }) {
  const [hir, setHir] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const hirBetoltese = async () => {
      const res = await fetch(`/api/posts/${params.id}`);
      const data = await res.json();
      setHir(data);
      setLoading(false);
    };
    hirBetoltese();
  }, [params.id]);

  if (loading)
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );

  return (
    <main className="flex min-h-screen flex-col bg-gradient-to-r from-[#6DAEF0] to-[#8DEBD1]">
      <div className="relative pt-20">
        <div className="absolute inset-0 bg-grid-white/[0.1] bg-[size:20px_20px]" />
        <article className="relative max-w-4xl mx-auto px-4 py-16 bg-white/90 backdrop-blur-md rounded-lg shadow-xl">
          <Link
            href="/hirek"
            className="inline-flex items-center text-blue-500 hover:text-blue-700 mb-8"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Vissza a hírekhez
          </Link>

          {hir?.imageUrl && (
            <img
              src={hir.imageUrl}
              alt={hir.title}
              className="w-full h-[400px] object-cover rounded-lg mb-8 shadow-lg"
            />
          )}

          <div className="flex items-center text-sm text-blue-500 mb-4">
            <Calendar className="h-4 w-4 mr-2" />
            {new Date(hir?.createdAt).toLocaleDateString("hu-HU")}
          </div>

          <h1 className="text-4xl font-bold mb-8">{hir?.title}</h1>

          <div
            className="prose max-w-none dark:prose-invert"
            dangerouslySetInnerHTML={{ __html: hir?.content }}
          />
        </article>
      </div>
    </main>
  );
}
