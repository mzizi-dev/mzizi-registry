"use client"

import * as React from "react"
import type { LucideProps } from "lucide-react"

/* ═══════════════════════════════════════════════════════════════
   NYUCHI ICONS — N1 Vertical Node
   Central icon registry. Import icons from here, not lucide-react.
   
   Usage:
     import { icons, Icon } from "@/lib/icons"
     <Icon name="success" size="md" />
     <icons.ArrowRight className="size-4" />
   ═══════════════════════════════════════════════════════════════ */

// ── Icon Size System ────────────────────────────────────────────

export const ICON_SIZES = {
  xs: 12,
  sm: 16,
  md: 20,
  lg: 24,
  xl: 32,
} as const

export type IconSize = keyof typeof ICON_SIZES

// ── Re-export Lucide icons with consistent naming ───────────────
// Components import from here instead of lucide-react directly.
// To swap an icon platform-wide, change the mapping here once.

export {
  // Navigation
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  ArrowDown,
  ArrowUpRight,
  ArrowDownLeft,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
  Menu,
  X,
  MoreHorizontal,
  MoreVertical,
  ExternalLink,
  Link2,
  Home,
  Search,
  Filter,
  SlidersHorizontal,

  // Actions
  Plus,
  Minus,
  Check,
  Copy,
  Download,
  Upload,
  Share2,
  Edit,
  Trash2,
  Save,
  RefreshCw,
  RotateCcw,
  Send,
  Reply,
  Forward,
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  Expand,
  Shrink,

  // Status & feedback
  CheckCircle,
  XCircle,
  AlertTriangle,
  AlertCircle,
  Info,
  HelpCircle,
  Loader2,
  Clock,
  Timer,
  Hourglass,
  ThumbsUp,
  ThumbsDown,
  Heart,
  Star,
  Flag,
  Bookmark,

  // Communication
  MessageSquare,
  MessageCircle,
  Mail,
  Bell,
  BellOff,
  Phone,
  Video,

  // Users & identity
  User,
  Users,
  UserPlus,
  UserCheck,
  UserX,
  Shield,
  ShieldCheck,
  Lock,
  Unlock,
  Key,
  Fingerprint,
  BadgeCheck,
  Award,

  // Commerce & finance
  CreditCard,
  Wallet,
  Banknote,
  Coins,
  Receipt,
  ShoppingBag,
  ShoppingCart,
  TrendingUp,
  TrendingDown,
  BarChart3,
  LineChart,
  PieChart,

  // Files & content
  File,
  FileText,
  FileImage,
  FileVideo,
  FileAudio,
  Folder,
  FolderOpen,
  Image,
  Camera,
  Mic,
  Film,
  Music,
  Type,
  Bold,
  Italic,
  List,
  ListOrdered,
  AlignLeft,
  Code2,

  // Location & maps
  MapPin,
  Navigation,
  Compass,
  Globe,
  Map,

  // Devices & system
  Monitor,
  Smartphone,
  Tablet,
  Wifi,
  WifiOff,
  Bluetooth,
  Battery,
  Settings,
  Cog,
  Wrench,
  Terminal,
  Database,
  Server,
  Cloud,
  CloudOff,
  Zap,
  Sun,
  Moon,
  Eye,
  EyeOff,
  Scan,
  QrCode,

  // Layout
  LayoutDashboard,
  LayoutGrid,
  LayoutList,
  Columns,
  Rows,
  PanelLeft,
  PanelRight,
  SidebarOpen,
  SidebarClose,
  Grip,
  GripVertical,
  Move,

  // Social
  Share,
  Globe2,
  Link,
  Hash,
  AtSign,
  Rss,

  // Extended (4.2.0) — additional icons consumed by brand components
  Calendar,
  Ticket,
  Activity,
  BookOpen,
  Newspaper,
  Repeat,
  ArrowRightLeft,
  Ban,
  Building2,
  CheckCheck,
  Flower2,
  Gift,
  LogOut,
  Package,
  Palette,
  Tag,
  Target,
  ZoomIn,
  ZoomOut,
} from "lucide-react"

// ── Semantic Icon Aliases ───────────────────────────────────────
// These map domain concepts to specific icons.
// When the design team changes which icon means "success",
// update this mapping and all components follow.

import {
  CheckCircle as _Success,
  XCircle as _Error,
  AlertTriangle as _Warning,
  Info as _Info,
  HelpCircle as _Help,
  Loader2 as _Loading,
  Shield as _Security,
  ShieldCheck as _Verified,
  Lock as _Locked,
  Unlock as _Unlocked,
  Wifi as _Online,
  WifiOff as _Offline,
  Cloud as _Cloud,
  CloudOff as _CloudOff,
  ArrowUpRight as _Send,
  ArrowDownLeft as _Receive,
  Wallet as _Wallet,
  Bell as _Notification,
  MessageSquare as _Chat,
  Users as _Community,
  MapPin as _Location,
  Search as _Search,
  Home as _Home,
  Settings as _Settings,
  User as _Profile,
  Star as _Favorite,
} from "lucide-react"

export const semanticIcons = {
  // Status
  success: _Success,
  error: _Error,
  warning: _Warning,
  info: _Info,
  help: _Help,
  loading: _Loading,

  // Security & trust
  security: _Security,
  verified: _Verified,
  locked: _Locked,
  unlocked: _Unlocked,

  // Connectivity
  online: _Online,
  offline: _Offline,
  cloud: _Cloud,
  cloudOff: _CloudOff,

  // Fintech
  send: _Send,
  receive: _Receive,
  wallet: _Wallet,

  // Platform
  notification: _Notification,
  chat: _Chat,
  community: _Community,
  location: _Location,
  search: _Search,
  home: _Home,
  settings: _Settings,
  profile: _Profile,
  favorite: _Favorite,
} as const

export type SemanticIconName = keyof typeof semanticIcons

// ── Icon Component ──────────────────────────────────────────────
// Semantic icon component with size presets and consistent styling.

interface IconProps extends Omit<LucideProps, "size"> {
  /** Semantic icon name or lucide icon name */
  name: SemanticIconName
  /** Size preset from the icon size system */
  size?: IconSize
  /** Override size in pixels */
  sizeOverride?: number
}

export function Icon({ name, size = "md", sizeOverride, className, ...props }: IconProps) {
  const IconComponent = semanticIcons[name]
  if (!IconComponent) return null
  const px = sizeOverride ?? ICON_SIZES[size]
  return <IconComponent width={px} height={px} className={className} {...props} />
}

// ── Custom Nyuchi Icons (brand-specific) ────────────────────────
// These don't exist in Lucide — they're Nyuchi originals.

export function MukokoLogo({
  size = 24,
  className,
  ...props
}: { size?: number; className?: string } & React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      {...props}
    >
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" />
      <path d="M8 12a4 4 0 108 0 4 4 0 00-8 0z" fill="currentColor" opacity="0.2" />
      <circle cx="12" cy="12" r="2" fill="currentColor" />
    </svg>
  )
}

export function MineralStrip({
  minerals,
  size = 4,
  className,
}: {
  minerals?: string[]
  size?: number
  className?: string
}) {
  const defaultMinerals = [
    "var(--color-cobalt,#0047AB)",
    "var(--color-tanzanite,#B388FF)",
    "var(--color-malachite,#64FFDA)",
    "var(--color-gold,#FFD740)",
    "var(--color-terracotta,#D4A574)",
  ]
  const colors = minerals || defaultMinerals
  return (
    <div className={className} style={{ display: "flex", gap: 2 }} aria-hidden="true">
      {colors.map((c, i) => (
        <div
          key={i}
          style={{ width: size, height: size, borderRadius: "50%", backgroundColor: c }}
        />
      ))}
    </div>
  )
}

export type { IconProps, LucideProps }
