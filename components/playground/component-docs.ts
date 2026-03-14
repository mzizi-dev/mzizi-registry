export interface ComponentDoc {
  useCases: string[]
  variants?: string[]
  sizes?: string[]
  features?: string[]
}

export const COMPONENT_DOCS: Record<string, ComponentDoc> = {
  accordion: {
    useCases: [
      "FAQ sections",
      "Settings panels with collapsible groups",
      "Navigation menus with expandable sections",
      "Content-heavy pages that need progressive disclosure",
    ],
    features: [
      "Single or multiple items open at once",
      "Keyboard navigation (Arrow keys, Home, End)",
      "Animated open/close transitions",
      "WAI-ARIA compliant",
    ],
  },
  alert: {
    useCases: [
      "Success/error/warning feedback messages",
      "System status notifications",
      "Form validation summaries",
      "Important information callouts",
    ],
    variants: ["default", "destructive"],
    features: [
      "Icon support with automatic grid layout",
      "AlertTitle and AlertDescription subcomponents",
      "AlertAction for inline actions",
      "role=\"alert\" for screen readers",
    ],
  },
  "alert-dialog": {
    useCases: [
      "Destructive action confirmation (delete, remove)",
      "Irreversible operation warnings",
      "Critical user decisions requiring explicit consent",
      "Payment or subscription confirmations",
    ],
    features: [
      "Focus trap — keyboard stays within dialog",
      "Blocks interaction with content behind",
      "Cancel and action buttons",
      "Accessible title and description",
    ],
  },
  "aspect-ratio": {
    useCases: [
      "Responsive image containers",
      "Video embeds with fixed ratio",
      "Thumbnail grids",
      "Map or chart containers",
    ],
    features: [
      "Any numeric ratio (16/9, 4/3, 1/1)",
      "Content scales within the ratio",
    ],
  },
  avatar: {
    useCases: [
      "User profile pictures",
      "Contact lists",
      "Comment sections",
      "Team member displays",
    ],
    features: [
      "Image with fallback to initials",
      "AvatarFallback for when image fails",
      "Composable with other components",
    ],
  },
  badge: {
    useCases: [
      "Status indicators (active, pending, error)",
      "Category labels",
      "Notification counts",
      "Version tags",
      "Technology stack labels",
    ],
    variants: ["default", "secondary", "destructive", "outline", "ghost", "link"],
    features: [
      "Compact size for inline use",
      "Supports asChild for polymorphic rendering",
    ],
  },
  breadcrumb: {
    useCases: [
      "Navigation hierarchy display",
      "File path indicators",
      "Multi-step form progress",
    ],
    features: [
      "Separator customization",
      "Ellipsis for deep paths",
      "Accessible nav landmark",
    ],
  },
  button: {
    useCases: [
      "Form submissions",
      "Call-to-action buttons",
      "Navigation triggers",
      "Dialog/modal openers",
      "Toggle actions",
    ],
    variants: ["default", "secondary", "destructive", "outline", "ghost", "link"],
    sizes: ["default", "xs", "sm", "lg", "icon", "icon-xs", "icon-sm", "icon-lg"],
    features: [
      "Polymorphic rendering via asChild (render as link, div, etc.)",
      "Loading states with disabled prop",
      "Icon-only sizes for toolbar buttons",
      "Focus ring for keyboard navigation",
    ],
  },
  "button-group": {
    useCases: [
      "Toolbar button groupings",
      "Segmented controls",
      "Action button sets",
    ],
    variants: ["horizontal", "vertical"],
    sizes: ["default", "sm", "lg"],
    features: [
      "Automatic separator between buttons",
      "Horizontal and vertical orientation",
    ],
  },
  calendar: {
    useCases: [
      "Date pickers",
      "Booking systems",
      "Event scheduling",
      "Date range selection",
    ],
    features: [
      "Single date and date range selection",
      "Keyboard navigation",
      "Customizable day rendering",
      "Built on react-day-picker",
    ],
  },
  card: {
    useCases: [
      "Content containers",
      "Product cards",
      "Dashboard widgets",
      "Settings panels",
      "List items with detail",
    ],
    sizes: ["default", "sm"],
    features: [
      "Composable subcomponents: Header, Title, Description, Content, Footer",
      "Clean border and shadow styling",
      "Size variants for compact layouts",
    ],
  },
  carousel: {
    useCases: [
      "Image galleries",
      "Product showcases",
      "Testimonial sliders",
      "Onboarding flows",
    ],
    features: [
      "Touch/swipe support",
      "Previous/Next buttons",
      "Built on Embla Carousel",
      "Horizontal and vertical orientation",
    ],
  },
  chart: {
    useCases: [
      "Data visualization dashboards",
      "Analytics displays",
      "Progress tracking",
      "Comparison charts",
    ],
    features: [
      "Built on Recharts",
      "Uses Five African Minerals chart colors",
      "Theme-aware (light/dark)",
      "Tooltip and legend support",
    ],
  },
  checkbox: {
    useCases: [
      "Multi-select options",
      "Terms acceptance",
      "Todo lists",
      "Feature toggles",
      "Filter selections",
    ],
    features: [
      "Checked, unchecked, and indeterminate states",
      "Keyboard accessible (Space to toggle)",
      "Animated check indicator",
      "aria-invalid error styling",
    ],
  },
  collapsible: {
    useCases: [
      "Expandable content sections",
      "Advanced settings panels",
      "Read more/less patterns",
    ],
    features: [
      "Open/closed state management",
      "Animated transitions",
      "Controlled and uncontrolled modes",
    ],
  },
  combobox: {
    useCases: [
      "Searchable select dropdowns",
      "Tag/label selectors",
      "Autocomplete search fields",
      "Command palettes",
    ],
    features: [
      "Typeahead filtering",
      "Keyboard navigation",
      "Custom item rendering",
      "Built on Base UI",
    ],
  },
  command: {
    useCases: [
      "Command palettes (Cmd+K)",
      "Search interfaces",
      "Action menus",
      "Keyboard-driven navigation",
    ],
    features: [
      "Fuzzy search built-in",
      "Grouped items",
      "Keyboard navigation",
      "Built on cmdk",
    ],
  },
  "context-menu": {
    useCases: [
      "Right-click menus",
      "File manager actions",
      "Canvas/editor context actions",
    ],
    features: [
      "Triggered by right-click",
      "Submenus support",
      "Keyboard shortcuts display",
      "Checkbox and radio items",
    ],
  },
  dialog: {
    useCases: [
      "Forms that need focused attention",
      "Detail views",
      "Confirmation dialogs",
      "Media previews",
    ],
    features: [
      "Focus trap and focus restoration",
      "Backdrop overlay",
      "Accessible title and description",
      "Close on Escape and backdrop click",
    ],
  },
  drawer: {
    useCases: [
      "Mobile-friendly bottom sheets",
      "Settings panels",
      "Filter panels",
      "Navigation menus on mobile",
    ],
    features: [
      "Drag-to-dismiss gesture",
      "Snap points",
      "Built on Vaul",
      "Mobile-optimized touch interactions",
    ],
  },
  "dropdown-menu": {
    useCases: [
      "Action menus on buttons",
      "User account menus",
      "Sort/filter options",
      "More options (ellipsis) menus",
    ],
    features: [
      "Submenus",
      "Checkbox and radio items",
      "Keyboard shortcuts display",
      "Separator and label groups",
    ],
  },
  empty: {
    useCases: [
      "Empty state displays",
      "No results found",
      "First-time user prompts",
      "Error recovery screens",
    ],
    features: [
      "Icon, title, and description slots",
      "CVA variants for different contexts",
    ],
  },
  field: {
    useCases: [
      "Form field wrappers",
      "Input with label and description",
      "Error message display",
    ],
    features: [
      "Label, description, and message subcomponents",
      "Error state styling",
      "Integrates with Label component",
    ],
  },
  form: {
    useCases: [
      "Complex forms with validation",
      "Multi-step forms",
      "Settings pages",
      "Registration/login forms",
    ],
    features: [
      "Built on React Hook Form",
      "Zod schema validation",
      "Accessible error messages",
      "Field-level validation display",
    ],
  },
  "hover-card": {
    useCases: [
      "User profile previews",
      "Link previews",
      "Tooltip-like rich content",
      "Product quick views",
    ],
    features: [
      "Rich content support (not just text)",
      "Configurable open/close delays",
      "Portal rendering",
    ],
  },
  input: {
    useCases: [
      "Text input fields",
      "Search bars",
      "Email/password fields",
      "Number inputs",
    ],
    features: [
      "All HTML input types supported",
      "Focus ring styling",
      "aria-invalid error state",
      "Disabled state",
    ],
  },
  "input-group": {
    useCases: [
      "Search with button",
      "Input with prefix/suffix icons",
      "URL input with protocol selector",
    ],
    features: [
      "Groups input, button, and addon elements",
      "Automatic border radius handling",
    ],
  },
  "input-otp": {
    useCases: [
      "Two-factor authentication",
      "Verification codes",
      "PIN entry",
    ],
    features: [
      "Copy-paste support",
      "Automatic focus advancement",
      "Accessible to screen readers",
      "Built on input-otp",
    ],
  },
  kbd: {
    useCases: [
      "Keyboard shortcut display",
      "Hotkey indicators",
      "Documentation for keyboard interactions",
    ],
    features: [
      "Styled keyboard key appearance",
      "Composable for key combinations",
    ],
  },
  label: {
    useCases: [
      "Form field labels",
      "Checkbox/radio labels",
      "Accessible input labeling",
    ],
    features: [
      "Automatically associates with form controls",
      "Peer-disabled styling",
      "Built on Radix Label",
    ],
  },
  menubar: {
    useCases: [
      "Desktop-style application menus",
      "Text editor toolbars",
      "Navigation bars with dropdowns",
    ],
    features: [
      "Keyboard navigation between menus",
      "Submenus",
      "Checkbox and radio items",
    ],
  },
  "native-select": {
    useCases: [
      "Mobile-friendly select menus",
      "Form selects where native behavior is preferred",
      "Accessibility-focused select fields",
    ],
    features: [
      "Uses native HTML select element",
      "Styled to match design system",
      "Best mobile experience",
    ],
  },
  "navigation-menu": {
    useCases: [
      "Main site navigation",
      "Documentation sidebar",
      "Multi-level navigation",
    ],
    features: [
      "Viewport-based content display",
      "Keyboard navigation",
      "CVA indicator variants",
    ],
  },
  pagination: {
    useCases: [
      "List pagination",
      "Search results pages",
      "Table data navigation",
    ],
    features: [
      "Previous/Next links",
      "Page number links",
      "Ellipsis for large page counts",
    ],
  },
  popover: {
    useCases: [
      "Rich tooltips",
      "Date picker triggers",
      "Color pickers",
      "Inline editing panels",
    ],
    features: [
      "Portal rendering",
      "Configurable alignment",
      "Focus management",
      "Dismiss on outside click",
    ],
  },
  progress: {
    useCases: [
      "File upload progress",
      "Task completion tracking",
      "Loading indicators",
      "Skill/proficiency bars",
    ],
    features: [
      "Determinate progress display",
      "Animated fill transitions",
      "Accessible progress reporting",
    ],
  },
  "radio-group": {
    useCases: [
      "Single-choice selections",
      "Settings with mutually exclusive options",
      "Survey/quiz answers",
      "Size/variant pickers",
    ],
    features: [
      "Arrow key navigation between options",
      "Accessible group labeling",
      "Controlled and uncontrolled modes",
    ],
  },
  resizable: {
    useCases: [
      "Split-pane layouts",
      "IDE-style panels",
      "Dashboard customization",
    ],
    features: [
      "Keyboard-accessible resize handles",
      "Horizontal and vertical groups",
      "Built on react-resizable-panels",
    ],
  },
  "scroll-area": {
    useCases: [
      "Long lists with custom scrollbars",
      "Code blocks",
      "Chat message containers",
      "Dropdown content overflow",
    ],
    features: [
      "Custom scrollbar styling",
      "Cross-browser consistency",
      "Horizontal and vertical scrolling",
    ],
  },
  select: {
    useCases: [
      "Dropdown selections",
      "Form select fields",
      "Filter controls",
      "Grouped option lists",
    ],
    features: [
      "Grouped items with labels",
      "Keyboard navigation",
      "Portal rendering for proper layering",
      "Placeholder support",
    ],
  },
  separator: {
    useCases: [
      "Content section dividers",
      "Menu item separators",
      "Toolbar dividers",
    ],
    features: [
      "Horizontal and vertical orientation",
      "Decorative or semantic",
    ],
  },
  sheet: {
    useCases: [
      "Mobile navigation drawers",
      "Settings panels",
      "Detail views from lists",
      "Filter panels",
    ],
    features: [
      "Slides in from any edge (top, right, bottom, left)",
      "Overlay backdrop",
      "Focus trap",
      "Extends Dialog component",
    ],
  },
  sidebar: {
    useCases: [
      "Application navigation",
      "Admin panel layouts",
      "Dashboard navigation",
      "Multi-section apps",
    ],
    features: [
      "Collapsible sections",
      "Icon-only collapsed mode",
      "Mobile-responsive (converts to sheet)",
      "Keyboard shortcut to toggle",
    ],
  },
  skeleton: {
    useCases: [
      "Loading placeholders",
      "Content shimmer effects",
      "Perceived performance improvement",
      "Layout preservation during load",
    ],
    features: [
      "Pulse animation",
      "Composable shapes (circles, rectangles, text lines)",
    ],
  },
  slider: {
    useCases: [
      "Volume/brightness controls",
      "Price range filters",
      "Rating inputs",
      "Numeric range selection",
    ],
    features: [
      "Single and range (dual thumb) modes",
      "Step increments",
      "Keyboard accessible",
      "Touch-friendly on mobile",
    ],
  },
  sonner: {
    useCases: [
      "Success/error toast notifications",
      "Action confirmations",
      "Background task completion alerts",
    ],
    features: [
      "Built on Sonner library",
      "Auto-dismiss with configurable duration",
      "Action buttons in toasts",
      "Theme-aware styling",
    ],
  },
  spinner: {
    useCases: [
      "Loading indicators",
      "Button loading states",
      "Inline loading feedback",
    ],
    features: [
      "Animated rotation",
      "Uses Lucide LoaderCircle icon",
    ],
  },
  switch: {
    useCases: [
      "On/off toggles",
      "Feature flags",
      "Settings preferences",
      "Dark mode toggle",
    ],
    sizes: ["default", "sm"],
    features: [
      "Animated thumb transition",
      "Keyboard accessible (Space to toggle)",
      "Two sizes for different contexts",
    ],
  },
  table: {
    useCases: [
      "Data tables",
      "Comparison charts",
      "Pricing tables",
      "Admin data views",
    ],
    features: [
      "Header, Body, Footer, Caption subcomponents",
      "Responsive horizontal scroll",
      "Striped row styling via hover",
    ],
  },
  tabs: {
    useCases: [
      "Content organization",
      "Settings sections",
      "Dashboard views",
      "Code/preview toggles",
    ],
    features: [
      "Horizontal and vertical orientation",
      "Default and line style variants",
      "Keyboard navigation (Arrow keys)",
      "Controlled and uncontrolled modes",
    ],
  },
  textarea: {
    useCases: [
      "Multi-line text input",
      "Comment boxes",
      "Message composition",
      "Code input fields",
    ],
    features: [
      "Auto-resize support via CSS",
      "Focus ring styling",
      "aria-invalid error state",
    ],
  },
  toast: {
    useCases: [
      "Temporary notifications",
      "Action feedback",
      "Error messages",
    ],
    variants: ["default", "destructive"],
    features: [
      "Auto-dismiss timer",
      "Action and close buttons",
      "Swipe to dismiss",
      "CVA variant styling",
    ],
  },
  toggle: {
    useCases: [
      "Formatting toolbar buttons (bold, italic, etc.)",
      "View mode switches",
      "Feature toggles",
    ],
    variants: ["default", "outline"],
    sizes: ["default", "sm", "lg"],
    features: [
      "Pressed/unpressed state",
      "Keyboard accessible",
      "Works standalone or in ToggleGroup",
    ],
  },
  "toggle-group": {
    useCases: [
      "Segmented controls",
      "View mode selection (grid/list)",
      "Text alignment selection",
    ],
    variants: ["default", "outline"],
    sizes: ["default", "sm", "lg"],
    features: [
      "Single or multiple selection mode",
      "Keyboard navigation between items",
      "Extends Toggle component",
    ],
  },
  tooltip: {
    useCases: [
      "Icon button labels",
      "Abbreviated text expansion",
      "Feature hints",
      "Keyboard shortcut display",
    ],
    features: [
      "Configurable delay",
      "Portal rendering",
      "Keyboard accessible (focus triggers)",
      "Provider for shared configuration",
    ],
  },
}
