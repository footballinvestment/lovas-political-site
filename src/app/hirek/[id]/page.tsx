import { Calendar, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { generateArticleMetadata } from "@/lib/seo";
import { ArticleStructuredData } from "@/components/seo/StructuredData";
import { notFound } from "next/navigation";

async function getPost(id: string) {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/posts/${id}`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) throw new Error("Failed to fetch post");
    return await res.json();
  } catch (error) {
    console.error("Error fetching post:", error);
    return null;
  }
}

export async function generateMetadata({ params }: { params: { id: string } }) {
  const post = await getPost(params.id);
  
  if (!post) {
    return {
      title: "Hír nem található",
      description: "A keresett hír nem található.",
    };
  }

  return generateArticleMetadata(
    post.title,
    post.excerpt || post.content.substring(0, 160),
    `/hirek/${params.id}`,
    post.createdAt,
    post.updatedAt,
    post.imageUrl
  );
}

export default async function HirReszletek({ params }: { params: { id: string } }) {
  const hir = await getPost(params.id);
  
  if (!hir) {
    notFound();
  }

  return (
    <>
      <ArticleStructuredData
        headline={hir.title}
        description={hir.excerpt || hir.content.substring(0, 160)}
        image={hir.imageUrl || "/images/og-news.jpg"}
        datePublished={hir.createdAt}
        dateModified={hir.updatedAt}
        url={`/hirek/${params.id}`}
      />
      
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
    </>
  );
}