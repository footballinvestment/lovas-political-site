// src/components/icons/optimized-icons.tsx
import React from 'react';
// Individual icon imports to reduce bundle size
// Instead of importing the entire lucide-react library

import dynamic from 'next/dynamic';
import {
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Menu,
  X,
  Search,
  Calendar,
  Clock,
  MapPin,
  Mail,
  Phone,
  ExternalLink,
  Eye,
  EyeOff,
  User,
  Settings,
  Home,
  FileText,
  Image,
  Video,
  Download,
  Upload,
  Check,
  AlertCircle,
  Info,
  Edit,
  Trash2,
  Plus,
  Minus,
  Share,
  Heart,
  Star,
  ArrowRight,
  ArrowLeft,
  ArrowUp,
  ArrowDown,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  RotateCcw,
  RefreshCw,
  Filter,
  SortAsc,
  SortDesc,
  MoreHorizontal,
  MoreVertical,
  Copy,
  Save,
  MessageSquare,
  ThumbsUp,
  ThumbsDown,
  Bookmark,
  Flag,
  UserPlus,
  UserMinus,
  Send,
  Reply,
  Forward,
  Quote,
  Bold,
  Italic,
  Underline,
  Link,
  List,
  Grid,
  Archive,
  Bell,
  BellOff,
  Lock,
  Unlock,
  Shield,
  Zap,
  Wifi,
  WifiOff,
  Database,
  Server,
  HardDrive,
  Cpu,
  Monitor,
  Smartphone,
  Tablet,
  Layout,
  Sidebar,
  Layers,
  Package,
  GitBranch,
  GitCommit,
  GitMerge,
  GitPullRequest,
  Code,
  Terminal,
  Type,
  Hash,
  AtSign,
  Globe,
  Navigation,
  Compass,
  Map,
  Route,
  TrendingUp,
  TrendingDown,
  Activity,
  BarChart,
  PieChart,
  Target,
  Award,
  Coffee,
  Moon,
  Sun,
  CloudRain,
  CloudSnow,
  Sunrise,
  Sunset,
  Wind,
  Thermometer,
  Loader2
} from 'lucide-react';

// Create dynamic icon loader with fallback
const createIcon = (iconName: string) => 
  dynamic(() => import('lucide-react').then(mod => ({ default: mod[iconName as keyof typeof mod] })), {
    loading: () => <div className="w-4 h-4 bg-gray-300 animate-pulse rounded" />,
    ssr: true,
  });

// Commonly used icons - import directly for better performance
export { 
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Menu,
  X,
  Search,
  Calendar,
  Clock,
  MapPin,
  Mail,
  Phone,
  ExternalLink,
  Eye,
  EyeOff,
  User,
  Settings,
  Home,
  FileText,
  Image,
  Video,
  Download,
  Upload,
  Check,
  AlertCircle,
  Info,
  Edit,
  Trash2,
  Plus,
  Minus,
  Check,
  AlertCircle,
  Info,
  Star,
  Heart,
  Share2,
  Copy,
  Link2,
  Globe,
  Shield,
  Lock,
  Unlock,
  Loader2,
  RefreshCw,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  ArrowDown,
  Save,
  Send,
} from 'lucide-react';

// Less common icons - dynamically imported
export const DynamicIcons = {
  // Admin icons
  BarChart3: createIcon('BarChart3'),
  PieChart: createIcon('PieChart'),
  TrendingUp: createIcon('TrendingUp'),
  TrendingDown: createIcon('TrendingDown'),
  Users: createIcon('Users'),
  Database: createIcon('Database'),
  
  // Social icons
  Facebook: createIcon('Facebook'),
  Twitter: createIcon('Twitter'),
  Instagram: createIcon('Instagram'),
  Youtube: createIcon('Youtube'),
  Linkedin: createIcon('Linkedin'),
  
  // Media icons
  Play: createIcon('Play'),
  Pause: createIcon('Pause'),
  Volume2: createIcon('Volume2'),
  VolumeX: createIcon('VolumeX'),
  Maximize: createIcon('Maximize'),
  Minimize: createIcon('Minimize'),
  
  // Document icons
  FileImage: createIcon('FileImage'),
  FileVideo: createIcon('FileVideo'),
  FilePdf: createIcon('FilePdf'),
  FileSpreadsheet: createIcon('FileSpreadsheet'),
  
  // Communication icons
  MessageCircle: createIcon('MessageCircle'),
  MessageSquare: createIcon('MessageSquare'),
  Bell: createIcon('Bell'),
  BellOff: createIcon('BellOff'),
  
  // Navigation icons
  Compass: createIcon('Compass'),
  Navigation: createIcon('Navigation'),
  Route: createIcon('Route'),
  
  // Weather icons
  Sun: createIcon('Sun'),
  Moon: createIcon('Moon'),
  Cloud: createIcon('Cloud'),
  CloudRain: createIcon('CloudRain'),
  
  // Technology icons
  Smartphone: createIcon('Smartphone'),
  Laptop: createIcon('Laptop'),
  Monitor: createIcon('Monitor'),
  Wifi: createIcon('Wifi'),
  WifiOff: createIcon('WifiOff'),
  
  // Financial icons
  CreditCard: createIcon('CreditCard'),
  DollarSign: createIcon('DollarSign'),
  TrendingDown: createIcon('TrendingDown'),
  
  // Time icons
  Timer: createIcon('Timer'),
  Stopwatch: createIcon('Stopwatch'),
  
  // Location icons
  Map: createIcon('Map'),
  MapPin: createIcon('MapPin'),
  Navigation2: createIcon('Navigation2'),
  
  // Security icons
  Key: createIcon('Key'),
  ShieldCheck: createIcon('ShieldCheck'),
  ShieldAlert: createIcon('ShieldAlert'),
  
  // File operations
  FolderOpen: createIcon('FolderOpen'),
  FolderClosed: createIcon('Folder'),
  Archive: createIcon('Archive'),
  
  // Miscellaneous
  Gift: createIcon('Gift'),
  Award: createIcon('Award'),
  Trophy: createIcon('Trophy'),
  Target: createIcon('Target'),
  Zap: createIcon('Zap'),
  Flame: createIcon('Flame'),
} as const;

// Icon component wrapper with consistent styling
interface IconProps {
  name: keyof typeof DynamicIcons;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  color?: string;
}

const sizeClasses = {
  sm: 'w-4 h-4',
  md: 'w-5 h-5',
  lg: 'w-6 h-6',
  xl: 'w-8 h-8',
};

export function DynamicIcon({ name, size = 'md', className = '', color }: IconProps) {
  const IconComponent = DynamicIcons[name];
  const sizeClass = sizeClasses[size];
  
  return (
    <IconComponent 
      className={`${sizeClass} ${className}`}
      style={color ? { color } : undefined}
    />
  );
}

// Pre-built icon combinations for common use cases
export function LoadingIcon({ size = 'md', className = '' }: { size?: keyof typeof sizeClasses; className?: string }) {
  return <Loader2 className={`${sizeClasses[size]} animate-spin ${className}`} />;
}

export function SuccessIcon({ size = 'md', className = '' }: { size?: keyof typeof sizeClasses; className?: string }) {
  return <Check className={`${sizeClasses[size]} text-green-500 ${className}`} />;
}

export function ErrorIcon({ size = 'md', className = '' }: { size?: keyof typeof sizeClasses; className?: string }) {
  return <AlertCircle className={`${sizeClasses[size]} text-red-500 ${className}`} />;
}

export function WarningIcon({ size = 'md', className = '' }: { size?: keyof typeof sizeClasses; className?: string }) {
  return <AlertCircle className={`${sizeClasses[size]} text-yellow-500 ${className}`} />;
}

export function InfoIcon({ size = 'md', className = '' }: { size?: keyof typeof sizeClasses; className?: string }) {
  return <Info className={`${sizeClasses[size]} text-blue-500 ${className}`} />;
}

// Icon sets for specific use cases
export const NavigationIcons = {
  Home,
  ArrowLeft,
  ArrowRight,
  Menu,
  X,
  Search,
} as const;

export const FormIcons = {
  Eye,
  EyeOff,
  Check,
  X,
  AlertCircle,
  Mail,
  Lock,
  User,
} as const;

export const MediaIcons = {
  Play: DynamicIcons.Play,
  Pause: DynamicIcons.Pause,
  Volume2: DynamicIcons.Volume2,
  VolumeX: DynamicIcons.VolumeX,
  Image,
  Video,
} as const;

export const AdminIcons = {
  Settings,
  Users: DynamicIcons.Users,
  BarChart3: DynamicIcons.BarChart3,
  FileText,
  Edit,
  Trash2,
  Plus,
  Save,
} as const;

// Bundle size optimization utility
export function getIconBundleSize() {
  // This would be used in development to track icon usage
  return {
    staticIcons: Object.keys(NavigationIcons).length + Object.keys(FormIcons).length,
    dynamicIcons: Object.keys(DynamicIcons).length,
    recommendation: 'Consider converting frequently used dynamic icons to static imports',
  };
}