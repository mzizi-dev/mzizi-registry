import { useMDXComponents as getNextraComponents } from "nextra-theme-docs"

// ── Brand components ────────────────────────────────────────────────
import { MineralStrip } from "@/components/brand/mineral-strip"
import { ColorSwatch } from "@/components/brand/color-swatch"
import { TokenTable } from "@/components/brand/token-table"
import { TypeScale } from "@/components/brand/type-scale"
import { SpacingScale } from "@/components/brand/spacing-scale"
import { BrandCard } from "@/components/brand/brand-card"
import { MukokoLogo } from "@/components/brand/mukoko-logo"

// ── UI components — every single one ────────────────────────────────
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Alert, AlertAction, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogOverlay,
  AlertDialogPortal,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { AspectRatio } from "@/components/ui/aspect-ratio"
import {
  Avatar,
  AvatarBadge,
  AvatarFallback,
  AvatarGroup,
  AvatarGroupCount,
  AvatarImage,
} from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import {
  Breadcrumb,
  BreadcrumbEllipsis,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Button } from "@/components/ui/button"
import { ButtonGroup, ButtonGroupSeparator, ButtonGroupText } from "@/components/ui/button-group"
import { Calendar, CalendarDayButton } from "@/components/ui/calendar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel"
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { Checkbox } from "@/components/ui/checkbox"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import {
  Combobox,
  ComboboxChip,
  ComboboxChipsInput,
  ComboboxChips,
  ComboboxCollection,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxGroup,
  ComboboxInput,
  ComboboxItem,
  ComboboxLabel,
  ComboboxList,
  ComboboxSeparator,
  ComboboxTrigger,
  ComboboxValue,
} from "@/components/ui/combobox"
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command"
import {
  ContextMenu,
  ContextMenuCheckboxItem,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuGroup,
  ContextMenuLabel,
  ContextMenuPortal,
  ContextMenuRadioGroup,
  ContextMenuRadioItem,
  ContextMenuSeparator,
  ContextMenuShortcut,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
} from "@/components/ui/context-menu"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { DirectionProvider } from "@/components/ui/direction"
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerOverlay,
  DrawerPortal,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuPortal,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSeparator,
  FieldSet,
  FieldTitle,
} from "@/components/ui/field"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card"
import { Input } from "@/components/ui/input"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
  InputGroupText,
  InputGroupTextarea,
} from "@/components/ui/input-group"
import { InputOTP, InputOTPGroup, InputOTPSeparator, InputOTPSlot } from "@/components/ui/input-otp"
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemFooter,
  ItemGroup,
  ItemHeader,
  ItemMedia,
  ItemSeparator,
  ItemTitle,
} from "@/components/ui/item"
import { Kbd, KbdGroup } from "@/components/ui/kbd"
import { Label } from "@/components/ui/label"
import {
  Menubar,
  MenubarCheckboxItem,
  MenubarContent,
  MenubarGroup,
  MenubarItem,
  MenubarLabel,
  MenubarMenu,
  MenubarPortal,
  MenubarRadioGroup,
  MenubarRadioItem,
  MenubarSeparator,
  MenubarShortcut,
  MenubarSub,
  MenubarSubContent,
  MenubarSubTrigger,
  MenubarTrigger,
} from "@/components/ui/menubar"
import {
  NativeSelect,
  NativeSelectOptGroup,
  NativeSelectOption,
} from "@/components/ui/native-select"
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuIndicator,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  NavigationMenuViewport,
} from "@/components/ui/navigation-menu"
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import {
  Popover,
  PopoverAnchor,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Progress } from "@/components/ui/progress"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectScrollDownButton,
  SelectScrollUpButton,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupAction,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInput,
  SidebarInset,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSkeleton,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarProvider,
  SidebarRail,
  SidebarSeparator,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { Skeleton } from "@/components/ui/skeleton"
import { Slider } from "@/components/ui/slider"
import { DataTable, DataTableColumnHeader } from "@/components/ui/data-table"
import { DatePicker, DateRangePicker } from "@/components/ui/date-picker"
import { Toaster as SonnerToaster } from "@/components/ui/sonner"
import { Spinner } from "@/components/ui/spinner"
import { Switch } from "@/components/ui/switch"
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import {
  Toast,
  ToastAction,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast"
import { Toaster } from "@/components/ui/toaster"
import { Toggle } from "@/components/ui/toggle"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import {
  TypographyH1,
  TypographyH2,
  TypographyH3,
  TypographyH4,
  TypographyP,
  TypographyBlockquote,
  TypographyInlineCode,
  TypographyLead,
  TypographyLarge,
  TypographySmall,
  TypographyMuted,
  TypographyList,
} from "@/components/ui/typography"

// ── Cross-app 2nd-level components ──────────────────────────────────
import { SearchBar } from "@/components/ui/search-bar"
import { UserMenu } from "@/components/ui/user-menu"
import { StatsCard } from "@/components/ui/stats-card"
import { FilterBar } from "@/components/ui/filter-bar"
import { ShareDialog } from "@/components/ui/share-dialog"
import { NotificationBell } from "@/components/ui/notification-bell"
import { FileUpload } from "@/components/ui/file-upload"
import { CopyButton } from "@/components/ui/copy-button"
import { StatusIndicator } from "@/components/ui/status-indicator"
import {
  Timeline,
  TimelineItem,
  TimelineDot,
  TimelineContent,
  TimelineTime,
  TimelineHeading,
  TimelineDescription,
} from "@/components/ui/timeline"
import { PricingCard } from "@/components/ui/pricing-card"
import { Rating } from "@/components/ui/rating"

// ── Mukoko higher-level components ──────────────────────────────────
import { MukokoSidebar } from "@/components/mukoko/mukoko-sidebar"
import { MukokoHeader } from "@/components/mukoko/mukoko-header"
import { MukokoFooter } from "@/components/mukoko/mukoko-footer"
import { MukokoBottomNav } from "@/components/mukoko/mukoko-bottom-nav"
import { DetailLayout } from "@/components/mukoko/detail-layout"
import { DashboardLayout } from "@/components/mukoko/dashboard-layout"

const nextraComponents = getNextraComponents()

export function useMDXComponents(components: Record<string, React.ComponentType>) {
  return {
    ...nextraComponents,

    // ── Brand ──────────────────────────────────────────────────────
    MineralStrip,
    ColorSwatch,
    TokenTable,
    TypeScale,
    SpacingScale,
    BrandCard,
    MukokoLogo,

    // ── Accordion ─────────────────────────────────────────────────
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,

    // ── Alert ─────────────────────────────────────────────────────
    Alert,
    AlertAction,
    AlertDescription,
    AlertTitle,

    // ── Alert Dialog ──────────────────────────────────────────────
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogMedia,
    AlertDialogOverlay,
    AlertDialogPortal,
    AlertDialogTitle,
    AlertDialogTrigger,

    // ── Aspect Ratio ──────────────────────────────────────────────
    AspectRatio,

    // ── Avatar ────────────────────────────────────────────────────
    Avatar,
    AvatarBadge,
    AvatarFallback,
    AvatarGroup,
    AvatarGroupCount,
    AvatarImage,

    // ── Badge ─────────────────────────────────────────────────────
    Badge,

    // ── Breadcrumb ────────────────────────────────────────────────
    Breadcrumb,
    BreadcrumbEllipsis,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,

    // ── Button ────────────────────────────────────────────────────
    Button,

    // ── Button Group ──────────────────────────────────────────────
    ButtonGroup,
    ButtonGroupSeparator,
    ButtonGroupText,

    // ── Calendar ──────────────────────────────────────────────────
    Calendar,
    CalendarDayButton,

    // ── Card ──────────────────────────────────────────────────────
    Card,
    CardContent,
    CardHeader,
    CardTitle,

    // ── Carousel ──────────────────────────────────────────────────
    Carousel,
    CarouselContent,
    CarouselItem,
    CarouselNext,
    CarouselPrevious,

    // ── Chart ─────────────────────────────────────────────────────
    ChartContainer,
    ChartLegend,
    ChartLegendContent,
    ChartTooltip,
    ChartTooltipContent,

    // ── Checkbox ──────────────────────────────────────────────────
    Checkbox,

    // ── Collapsible ───────────────────────────────────────────────
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,

    // ── Combobox ──────────────────────────────────────────────────
    Combobox,
    ComboboxChip,
    ComboboxChipsInput,
    ComboboxChips,
    ComboboxCollection,
    ComboboxContent,
    ComboboxEmpty,
    ComboboxGroup,
    ComboboxInput,
    ComboboxItem,
    ComboboxLabel,
    ComboboxList,
    ComboboxSeparator,
    ComboboxTrigger,
    ComboboxValue,

    // ── Command ───────────────────────────────────────────────────
    Command,
    CommandDialog,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
    CommandSeparator,
    CommandShortcut,

    // ── Context Menu ──────────────────────────────────────────────
    ContextMenu,
    ContextMenuCheckboxItem,
    ContextMenuContent,
    ContextMenuItem,
    ContextMenuGroup,
    ContextMenuLabel,
    ContextMenuPortal,
    ContextMenuRadioGroup,
    ContextMenuRadioItem,
    ContextMenuSeparator,
    ContextMenuShortcut,
    ContextMenuSub,
    ContextMenuSubContent,
    ContextMenuSubTrigger,
    ContextMenuTrigger,

    // ── Dialog ────────────────────────────────────────────────────
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogOverlay,
    DialogPortal,
    DialogTitle,
    DialogTrigger,

    // ── Direction ─────────────────────────────────────────────────
    DirectionProvider,

    // ── Drawer ────────────────────────────────────────────────────
    Drawer,
    DrawerClose,
    DrawerContent,
    DrawerDescription,
    DrawerFooter,
    DrawerHeader,
    DrawerOverlay,
    DrawerPortal,
    DrawerTitle,
    DrawerTrigger,

    // ── Dropdown Menu ─────────────────────────────────────────────
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuPortal,
    DropdownMenuRadioGroup,
    DropdownMenuRadioItem,
    DropdownMenuSeparator,
    DropdownMenuShortcut,
    DropdownMenuSub,
    DropdownMenuSubContent,
    DropdownMenuSubTrigger,
    DropdownMenuTrigger,

    // ── Empty ─────────────────────────────────────────────────────
    Empty,
    EmptyContent,
    EmptyDescription,
    EmptyHeader,
    EmptyMedia,
    EmptyTitle,

    // ── Field ─────────────────────────────────────────────────────
    Field,
    FieldContent,
    FieldDescription,
    FieldError,
    FieldGroup,
    FieldLabel,
    FieldLegend,
    FieldSeparator,
    FieldSet,
    FieldTitle,

    // ── Form ──────────────────────────────────────────────────────
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,

    // ── Hover Card ────────────────────────────────────────────────
    HoverCard,
    HoverCardContent,
    HoverCardTrigger,

    // ── Input ─────────────────────────────────────────────────────
    Input,

    // ── Input Group ───────────────────────────────────────────────
    InputGroup,
    InputGroupAddon,
    InputGroupButton,
    InputGroupInput,
    InputGroupText,
    InputGroupTextarea,

    // ── Input OTP ─────────────────────────────────────────────────
    InputOTP,
    InputOTPGroup,
    InputOTPSeparator,
    InputOTPSlot,

    // ── Item ──────────────────────────────────────────────────────
    Item,
    ItemActions,
    ItemContent,
    ItemDescription,
    ItemFooter,
    ItemGroup,
    ItemHeader,
    ItemMedia,
    ItemSeparator,
    ItemTitle,

    // ── Kbd ───────────────────────────────────────────────────────
    Kbd,
    KbdGroup,

    // ── Label ─────────────────────────────────────────────────────
    Label,

    // ── Menubar ───────────────────────────────────────────────────
    Menubar,
    MenubarCheckboxItem,
    MenubarContent,
    MenubarGroup,
    MenubarItem,
    MenubarLabel,
    MenubarMenu,
    MenubarPortal,
    MenubarRadioGroup,
    MenubarRadioItem,
    MenubarSeparator,
    MenubarShortcut,
    MenubarSub,
    MenubarSubContent,
    MenubarSubTrigger,
    MenubarTrigger,

    // ── Native Select ─────────────────────────────────────────────
    NativeSelect,
    NativeSelectOptGroup,
    NativeSelectOption,

    // ── Navigation Menu ───────────────────────────────────────────
    NavigationMenu,
    NavigationMenuContent,
    NavigationMenuItem,
    NavigationMenuIndicator,
    NavigationMenuLink,
    NavigationMenuList,
    NavigationMenuTrigger,
    NavigationMenuViewport,

    // ── Pagination ────────────────────────────────────────────────
    Pagination,
    PaginationContent,
    PaginationEllipsis,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,

    // ── Popover ───────────────────────────────────────────────────
    Popover,
    PopoverAnchor,
    PopoverContent,
    PopoverDescription,
    PopoverHeader,
    PopoverTitle,
    PopoverTrigger,

    // ── Progress ──────────────────────────────────────────────────
    Progress,

    // ── Radio Group ───────────────────────────────────────────────
    RadioGroup,
    RadioGroupItem,

    // ── Resizable ─────────────────────────────────────────────────
    ResizableHandle,
    ResizablePanel,
    ResizablePanelGroup,

    // ── Scroll Area ───────────────────────────────────────────────
    ScrollArea,
    ScrollBar,

    // ── Select ────────────────────────────────────────────────────
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectLabel,
    SelectScrollDownButton,
    SelectScrollUpButton,
    SelectSeparator,
    SelectTrigger,
    SelectValue,

    // ── Separator ─────────────────────────────────────────────────
    Separator,

    // ── Sheet ─────────────────────────────────────────────────────
    Sheet,
    SheetClose,
    SheetContent,
    SheetDescription,
    SheetFooter,
    SheetHeader,
    SheetTitle,
    SheetTrigger,

    // ── Sidebar ───────────────────────────────────────────────────
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupAction,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarHeader,
    SidebarInput,
    SidebarInset,
    SidebarMenu,
    SidebarMenuAction,
    SidebarMenuBadge,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarMenuSkeleton,
    SidebarMenuSub,
    SidebarMenuSubButton,
    SidebarMenuSubItem,
    SidebarProvider,
    SidebarRail,
    SidebarSeparator,
    SidebarTrigger,

    // ── Skeleton ──────────────────────────────────────────────────
    Skeleton,

    // ── Slider ────────────────────────────────────────────────────
    Slider,

    // ── Data Table ─────────────────────────────────────────────────
    DataTable,
    DataTableColumnHeader,

    // ── Date Picker ───────────────────────────────────────────────
    DatePicker,
    DateRangePicker,

    // ── Sonner (toast notifications) ──────────────────────────────
    SonnerToaster,

    // ── Spinner ───────────────────────────────────────────────────
    Spinner,

    // ── Switch ────────────────────────────────────────────────────
    Switch,

    // ── Table ─────────────────────────────────────────────────────
    Table,
    TableBody,
    TableCaption,
    TableCell,
    TableFooter,
    TableHead,
    TableHeader,
    TableRow,

    // ── Tabs ──────────────────────────────────────────────────────
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,

    // ── Textarea ──────────────────────────────────────────────────
    Textarea,

    // ── Toast ─────────────────────────────────────────────────────
    Toast,
    ToastAction,
    ToastClose,
    ToastDescription,
    ToastProvider,
    ToastTitle,
    ToastViewport,
    Toaster,

    // ── Toggle ────────────────────────────────────────────────────
    Toggle,

    // ── Toggle Group ──────────────────────────────────────────────
    ToggleGroup,
    ToggleGroupItem,

    // ── Tooltip ───────────────────────────────────────────────────
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,

    // ── Typography ────────────────────────────────────────────────
    TypographyH1,
    TypographyH2,
    TypographyH3,
    TypographyH4,
    TypographyP,
    TypographyBlockquote,
    TypographyInlineCode,
    TypographyLead,
    TypographyLarge,
    TypographySmall,
    TypographyMuted,
    TypographyList,

    // ── Cross-app 2nd-level components ──────────────────────────
    SearchBar,
    UserMenu,
    StatsCard,
    FilterBar,
    ShareDialog,
    NotificationBell,
    FileUpload,
    CopyButton,
    StatusIndicator,
    Timeline,
    TimelineItem,
    TimelineDot,
    TimelineContent,
    TimelineTime,
    TimelineHeading,
    TimelineDescription,
    PricingCard,
    Rating,

    // ── Mukoko higher-level components ────────────────────────────
    MukokoSidebar,
    MukokoHeader,
    MukokoFooter,
    MukokoBottomNav,
    DetailLayout,
    DashboardLayout,

    // ── Page-level overrides (must come last) ─────────────────────
    ...components,
  }
}
