// src/components/dynamic/index.tsx
import React from 'react';
import dynamic from 'next/dynamic';
import { SkeletonCard, SkeletonSection, SkeletonText } from '@/components/common/LazyWrapper';

// Loading components for better UX
const DefaultLoading = () => (
  <div className="animate-pulse bg-gray-200 dark:bg-gray-700 h-32 rounded" />
);

const FormLoading = () => (
  <div className="animate-pulse space-y-4 p-6 border rounded-lg">
    <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/4" />
    <div className="space-y-3">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="h-10 bg-gray-200 dark:bg-gray-700 rounded" />
      ))}
    </div>
    <div className="h-24 bg-gray-200 dark:bg-gray-700 rounded" />
    <div className="h-10 bg-blue-200 dark:bg-blue-700 rounded w-32" />
  </div>
);

const EditorLoading = () => (
  <div className="animate-pulse space-y-4 border rounded-lg p-4">
    <div className="flex space-x-2">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded" />
      ))}
    </div>
    <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded" />
  </div>
);

// Dynamic imports for heavy components with code splitting

// Admin Components (loaded only when needed)
export const DynamicAdminLayout = dynamic(
  () => import('@/components/layout/AdminLayout'),
  {
    loading: () => <DefaultLoading />,
    ssr: false, // Admin panel doesn't need SSR
  }
);

export const DynamicAdminDashboard = dynamic(
  () => import('@/components/admin/AdminDashboard'),
  {
    loading: () => <SkeletonSection title cards={4} className="p-6" />,
    ssr: false,
  }
);

// Rich Text Editor (heavy component)
export const DynamicRichTextEditor = dynamic(
  () => import('@/components/editor/RichTextEditor'),
  {
    loading: () => <EditorLoading />,
    ssr: false, // Editor needs DOM
  }
);

// Form Components (can be split by route)
export const DynamicContactForm = dynamic(
  () => import('@/components/forms/ContactForm'),
  {
    loading: () => <FormLoading />,
    ssr: true, // Keep SSR for SEO
  }
);

export const DynamicNewsletterForm = dynamic(
  () => import('@/components/forms/NewsletterForm'),
  {
    loading: () => (
      <div className="animate-pulse">
        <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded mb-2" />
        <div className="h-10 bg-blue-200 dark:bg-blue-700 rounded w-32" />
      </div>
    ),
    ssr: true,
  }
);

// Content Sections (lazy loaded)
export const DynamicEventsSection = dynamic(
  () => import('@/components/sections/EventsSection').then(mod => ({ default: mod.EventsSection })),
  {
    loading: () => <SkeletonSection title cards={3} className="py-8" />,
    ssr: true, // Keep for SEO but lazy load on client
  }
);

export const DynamicHirekSzekcio = dynamic(
  () => import('@/components/sections/HirekSzekcio').then(mod => ({ default: mod.HirekSzekcio })),
  {
    loading: () => <SkeletonSection title cards={4} className="py-8" />,
    ssr: true,
  }
);

// Hero components (split by type)
export const DynamicHeroSlider = dynamic(
  () => import('@/components/hero/HeroSlider'),
  {
    loading: () => (
      <div className="h-96 bg-gradient-to-r from-blue-600 to-purple-600 animate-pulse rounded-lg" />
    ),
    ssr: true, // Hero should be server-rendered for better LCP
  }
);

// Chart and Data Visualization Components
export const DynamicChart = dynamic(
  () => import('@/components/charts/Chart'),
  {
    loading: () => (
      <div className="animate-pulse bg-gray-200 dark:bg-gray-700 h-64 rounded" />
    ),
    ssr: false, // Charts usually need client-side libraries
  }
);

// Modal Components (only load when needed)
export const DynamicModal = dynamic(
  () => import('@/components/ui/Modal'),
  {
    loading: () => null, // No loading state for modals
    ssr: false,
  }
);

export const DynamicImageGallery = dynamic(
  () => import('@/components/gallery/ImageGallery'),
  {
    loading: () => (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="aspect-square bg-gray-200 dark:bg-gray-700 animate-pulse rounded" />
        ))}
      </div>
    ),
    ssr: false,
  }
);

// Video Player (heavy component)
export const DynamicVideoPlayer = dynamic(
  () => import('@/components/media/VideoPlayer'),
  {
    loading: () => (
      <div className="aspect-video bg-black rounded-lg flex items-center justify-center">
        <div className="text-white">
          <svg className="w-16 h-16 animate-pulse" fill="currentColor" viewBox="0 0 20 20">
            <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
          </svg>
        </div>
      </div>
    ),
    ssr: false,
  }
);

// Calendar Components
export const DynamicCalendar = dynamic(
  () => import('@/components/calendar/Calendar'),
  {
    loading: () => (
      <div className="animate-pulse">
        <div className="grid grid-cols-7 gap-1 mb-4">
          {Array.from({ length: 35 }).map((_, i) => (
            <div key={i} className="h-10 bg-gray-200 dark:bg-gray-700 rounded" />
          ))}
        </div>
      </div>
    ),
    ssr: false,
  }
);

// Search Components
export const DynamicSearchBox = dynamic(
  () => import('@/components/search/SearchBox'),
  {
    loading: () => (
      <div className="animate-pulse">
        <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded" />
      </div>
    ),
    ssr: true,
  }
);

// Social Media Components
export const DynamicSocialShare = dynamic(
  () => import('@/components/social/SocialShare'),
  {
    loading: () => (
      <div className="flex space-x-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="w-10 h-10 bg-gray-200 dark:bg-gray-700 animate-pulse rounded" />
        ))}
      </div>
    ),
    ssr: false,
  }
);

// Comments System
export const DynamicComments = dynamic(
  () => import('@/components/comments/Comments'),
  {
    loading: () => (
      <div className="space-y-4">
        <SkeletonText lines={2} />
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="border rounded p-4">
              <SkeletonText lines={3} />
            </div>
          ))}
        </div>
      </div>
    ),
    ssr: false,
  }
);

// Theme Switcher (light component but can be lazy loaded)
export const DynamicThemeToggle = dynamic(
  () => import('@/components/ui/ThemeToggle'),
  {
    loading: () => (
      <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 animate-pulse rounded" />
    ),
    ssr: false, // Theme switching needs client-side
  }
);

// PDF Viewer
export const DynamicPDFViewer = dynamic(
  () => import('@/components/document/PDFViewer'),
  {
    loading: () => (
      <div className="h-96 bg-gray-200 dark:bg-gray-700 animate-pulse rounded flex items-center justify-center">
        <div className="text-gray-500">PDF betöltése...</div>
      </div>
    ),
    ssr: false,
  }
);

// Export all components for easy importing
export const DynamicComponents = {
  // Admin
  AdminLayout: DynamicAdminLayout,
  AdminDashboard: DynamicAdminDashboard,
  
  // Forms
  ContactForm: DynamicContactForm,
  NewsletterForm: DynamicNewsletterForm,
  
  // Content
  EventsSection: DynamicEventsSection,
  HirekSzekcio: DynamicHirekSzekcio,
  HeroSlider: DynamicHeroSlider,
  
  // UI
  Modal: DynamicModal,
  ThemeToggle: DynamicThemeToggle,
  SearchBox: DynamicSearchBox,
  
  // Media
  VideoPlayer: DynamicVideoPlayer,
  ImageGallery: DynamicImageGallery,
  PDFViewer: DynamicPDFViewer,
  
  // Interactive
  Calendar: DynamicCalendar,
  Chart: DynamicChart,
  Comments: DynamicComments,
  SocialShare: DynamicSocialShare,
  
  // Editor
  RichTextEditor: DynamicRichTextEditor,
} as const;

// Route-based component splitting
export const RouteComponents = {
  '/admin': {
    Layout: DynamicAdminLayout,
    Dashboard: DynamicAdminDashboard,
    Editor: DynamicRichTextEditor,
  },
  '/contact': {
    Form: DynamicContactForm,
  },
  '/events': {
    Calendar: DynamicCalendar,
    EventsSection: DynamicEventsSection,
  },
  '/gallery': {
    ImageGallery: DynamicImageGallery,
  },
} as const;