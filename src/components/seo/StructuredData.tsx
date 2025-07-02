// src/components/seo/StructuredData.tsx
import React from "react";

interface PersonSchema {
  "@type": "Person";
  name: string;
  jobTitle: string;
  url: string;
  image: string;
  description: string;
  address: {
    "@type": "PostalAddress";
    addressCountry: string;
    addressLocality: string;
  };
  memberOf: {
    "@type": "Organization";
    name: string;
  };
  sameAs: string[];
}

interface OrganizationSchema {
  "@type": "Organization" | "PoliticalParty";
  name: string;
  url: string;
  logo: string;
  description: string;
  founder: PersonSchema;
  address: {
    "@type": "PostalAddress";
    addressCountry: string;
    addressLocality: string;
  };
  sameAs: string[];
}

interface ArticleSchema {
  "@type": "Article";
  headline: string;
  description: string;
  image: string;
  datePublished: string;
  dateModified?: string;
  author: PersonSchema;
  publisher: OrganizationSchema;
  url: string;
  articleSection: string;
}

interface EventSchema {
  "@type": "Event";
  name: string;
  description: string;
  startDate: string;
  endDate?: string;
  location: {
    "@type": "Place";
    name: string;
    address: {
      "@type": "PostalAddress";
      addressCountry: string;
      addressLocality: string;
    };
  };
  organizer: OrganizationSchema;
  url: string;
}

interface ProgramPointSchema {
  "@type": "Article";
  headline: string;
  description: string;
  author: PersonSchema;
  publisher: OrganizationSchema;
  datePublished: string;
  url: string;
  articleSection: string;
  about: {
    "@type": "Thing";
    name: string;
  };
}

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://lovaszoltan.hu";

export const PERSON_SCHEMA: PersonSchema = {
  "@type": "Person",
  name: "Lovas Zoltán György",
  jobTitle: "Politikus, Mindenki Magyarországa Néppárt",
  url: BASE_URL,
  image: `${BASE_URL}/images/lovas-zoltan.jpg`,
  description: "Lovas Zoltán György, a Mindenki Magyarországa Néppárt politikusa",
  address: {
    "@type": "PostalAddress",
    addressCountry: "HU",
    addressLocality: "Budapest",
  },
  memberOf: {
    "@type": "Organization",
    name: "Mindenki Magyarországa Néppárt",
  },
  sameAs: [
    "https://facebook.com/lovaszoltan",
    "https://twitter.com/lovaszoltan",
    "https://instagram.com/lovaszoltan",
  ],
};

export const ORGANIZATION_SCHEMA: OrganizationSchema = {
  "@type": "PoliticalParty",
  name: "Mindenki Magyarországa Néppárt",
  url: BASE_URL,
  logo: `${BASE_URL}/images/logo.png`,
  description: "Mindenki Magyarországa Néppárt - Modern megoldások egy igazságosabb Magyarországért",
  founder: PERSON_SCHEMA,
  address: {
    "@type": "PostalAddress",
    addressCountry: "HU",
    addressLocality: "Budapest",
  },
  sameAs: [
    "https://facebook.com/mindenkimagyarorszaga",
    "https://twitter.com/mindenkimagyar",
    "https://instagram.com/mindenkimagyarorszaga",
  ],
};

interface StructuredDataProps {
  schema: PersonSchema | OrganizationSchema | ArticleSchema | EventSchema | ProgramPointSchema | any;
}

export function StructuredData({ schema }: StructuredDataProps) {
  const jsonLd = {
    "@context": "https://schema.org",
    ...schema,
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}

export function PersonStructuredData() {
  return <StructuredData schema={PERSON_SCHEMA} />;
}

export function OrganizationStructuredData() {
  return <StructuredData schema={ORGANIZATION_SCHEMA} />;
}

export function ArticleStructuredData({
  headline,
  description,
  image,
  datePublished,
  dateModified,
  url,
  articleSection = "Hírek",
}: {
  headline: string;
  description: string;
  image: string;
  datePublished: string;
  dateModified?: string;
  url: string;
  articleSection?: string;
}) {
  const schema: ArticleSchema = {
    "@type": "Article",
    headline,
    description,
    image: image.startsWith("http") ? image : `${BASE_URL}${image}`,
    datePublished,
    dateModified: dateModified || datePublished,
    author: PERSON_SCHEMA,
    publisher: ORGANIZATION_SCHEMA,
    url: `${BASE_URL}${url}`,
    articleSection,
  };

  return <StructuredData schema={schema} />;
}

export function EventStructuredData({
  name,
  description,
  startDate,
  endDate,
  locationName,
  locationAddress = "Budapest",
  url,
}: {
  name: string;
  description: string;
  startDate: string;
  endDate?: string;
  locationName: string;
  locationAddress?: string;
  url: string;
}) {
  const schema: EventSchema = {
    "@type": "Event",
    name,
    description,
    startDate,
    endDate,
    location: {
      "@type": "Place",
      name: locationName,
      address: {
        "@type": "PostalAddress",
        addressCountry: "HU",
        addressLocality: locationAddress,
      },
    },
    organizer: ORGANIZATION_SCHEMA,
    url: `${BASE_URL}${url}`,
  };

  return <StructuredData schema={schema} />;
}

export function ProgramPointStructuredData({
  headline,
  description,
  datePublished,
  url,
  category,
}: {
  headline: string;
  description: string;
  datePublished: string;
  url: string;
  category: string;
}) {
  const schema: ProgramPointSchema = {
    "@type": "Article",
    headline,
    description,
    author: PERSON_SCHEMA,
    publisher: ORGANIZATION_SCHEMA,
    datePublished,
    url: `${BASE_URL}${url}`,
    articleSection: "Programpontok",
    about: {
      "@type": "Thing",
      name: category,
    },
  };

  return <StructuredData schema={schema} />;
}