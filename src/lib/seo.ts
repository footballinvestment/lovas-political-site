// src/lib/seo.ts
import { Metadata } from "next";

export interface SEOData {
  title: string;
  description: string;
  keywords?: string;
  image?: string;
  url?: string;
  type?: "website" | "article" | "profile";
  publishedTime?: string;
  modifiedTime?: string;
  author?: string;
  section?: string;
}

const DEFAULT_METADATA = {
  siteName: "Lovas Zoltán György",
  baseUrl: process.env.NEXT_PUBLIC_BASE_URL || "https://lovaszoltan.hu",
  defaultImage: "/images/og-default.jpg",
  author: "Lovas Zoltán György",
  locale: "hu_HU",
  type: "website" as const,
};

export function generateMetadata(seoData: SEOData): Metadata {
  const {
    title,
    description,
    keywords,
    image = DEFAULT_METADATA.defaultImage,
    url,
    type = "website",
    publishedTime,
    modifiedTime,
    author = DEFAULT_METADATA.author,
    section,
  } = seoData;

  const fullTitle = `${title} | ${DEFAULT_METADATA.siteName}`;
  const fullUrl = url ? `${DEFAULT_METADATA.baseUrl}${url}` : DEFAULT_METADATA.baseUrl;
  const fullImageUrl = image.startsWith("http") ? image : `${DEFAULT_METADATA.baseUrl}${image}`;

  const metadata: Metadata = {
    title: fullTitle,
    description,
    keywords,
    authors: [{ name: author }],
    creator: author,
    publisher: DEFAULT_METADATA.siteName,
    metadataBase: new URL(DEFAULT_METADATA.baseUrl),
    alternates: {
      canonical: fullUrl,
    },
    openGraph: {
      title: fullTitle,
      description,
      url: fullUrl,
      siteName: DEFAULT_METADATA.siteName,
      locale: DEFAULT_METADATA.locale,
      type,
      images: [
        {
          url: fullImageUrl,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description,
      images: [fullImageUrl],
      creator: "@lovaszoltan",
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-video-preview": -1,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },
  };

  // Add article-specific metadata
  if (type === "article") {
    metadata.openGraph = {
      ...metadata.openGraph,
      type: "article",
      publishedTime,
      modifiedTime,
      authors: [author],
      section,
    };
  }

  return metadata;
}

export function generatePageMetadata(
  title: string,
  description: string,
  path?: string,
  additionalData?: Partial<SEOData>
): Metadata {
  return generateMetadata({
    title,
    description,
    url: path,
    ...additionalData,
  });
}

export function generateArticleMetadata(
  title: string,
  description: string,
  path: string,
  publishedTime: string,
  modifiedTime?: string,
  image?: string,
  author?: string
): Metadata {
  return generateMetadata({
    title,
    description,
    url: path,
    type: "article",
    publishedTime,
    modifiedTime,
    image,
    author,
    section: "Hírek",
  });
}