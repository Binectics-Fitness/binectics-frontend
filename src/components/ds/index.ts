// Design System v2 — Primitives
// All components follow shared.css tokens from the Binectics design prototype

// Async states
export { AsyncSpinner, EmptySlate } from "./AsyncStates";
export { NavigationProgress, startNavigationProgress } from "./NavigationProgress";
export { RouteError } from "./RouteError";
export { WorkspaceShell } from "./WorkspaceShell";
export { RoleShell } from "./RoleShell";
export { ShellNotificationBell } from "./ShellNotificationBell";

// Phase 1 — core primitives
export { Eyebrow } from "./Eyebrow";
export type { EyebrowTone } from "./Eyebrow";
export { StatusDot } from "./StatusDot";
export { FilterPill } from "./FilterPill";
export { ChipEditor } from "./ChipEditor";
export { DSCard, DSCardHead } from "./DSCard";
export { DSStatCard } from "./DSStatCard";
export type { StatCardSize, DeltaTone } from "./DSStatCard";
export { DSTable, DSTableHead, DSTableTh, DSTableRow, DSTableTd } from "./DSTable";
export { DashboardTopbar } from "./DashboardTopbar";

// Mosaic primitives — the homepage-mockup pattern for product screens.
// Same names as the mobile app's components; see src/lib/ui/activity.ts.
export { TitleWithEmphasis } from "./TitleWithEmphasis";
export type { TitleParts } from "./TitleWithEmphasis";
export { PageHeader } from "./PageHeader";
export { HeroStatCard } from "./HeroStatCard";
export type { HeroProgress } from "./HeroStatCard";
export { ProgressBar } from "./ProgressBar";
export { WeekStrip } from "./WeekStrip";
export { ActivityHeatmap, HEAT_COLORS } from "./ActivityHeatmap";
export { ListRow } from "./ListRow";
export { SuccessTakeover, TAKEOVER_LAYER_ATTR } from "./SuccessTakeover";
export type { TakeoverAction } from "./SuccessTakeover";
export { Sparkline } from "./Sparkline";

// Phase 2 — booking + provider patterns
export { StatusPill } from "./StatusPill";
export { IconTile } from "./IconTile";
export type { IconTileSize } from "./IconTile";
export { NotificationIconTile } from "./NotificationIconTile";
export { BookingStatusBadge } from "./BookingStatusBadge";
export { ReceiptTable } from "./ReceiptTable";
export { Wizard } from "./Wizard";
export { SectionNav } from "./SectionNav";

// Phase 3 — dashboard shells
export { MemberDashboardShell } from "./MemberDashboardShell";
export { TrainerDashboardShell } from "./TrainerDashboardShell";
export { DietitianDashboardShell } from "./DietitianDashboardShell";
export { GymDashboardShell } from "./GymDashboardShell";
export { AdminDashboardShell } from "./AdminDashboardShell";

// Phase 4 — marketing primitives
export { TogglePill } from "./TogglePill";
export { PlanCard } from "./PlanCard";
export type { PlanCardPlan } from "./PlanCard";

// Phase 5 — overlay primitives
export { Drawer } from "./Drawer";
export { Tooltip } from "./Tooltip";
export { Popover, PopoverItem } from "./Popover";
export { Lightbox } from "./Lightbox";

// Phase 5 — table enhancements
export { DSCheckbox } from "./DSCheckbox";
export { DSPagination } from "./DSPagination";
export { DSTableToolbar } from "./DSTableToolbar";
export { BulkActionBar } from "./BulkActionBar";

// Phase 5 — input components
export { DateRangePicker } from "./DateRangePicker";
export { MultiSelect } from "./MultiSelect";
export { FileUploadZone } from "./FileUploadZone";
export { MoneyInput } from "./MoneyInput";
export type { MoneyInputProps } from "./MoneyInput";

// Phase 5 — action modal system
export { ActionModal } from "./ActionModal";

// Phase 5 — global overlays
export { CommandBar } from "./CommandBar";
export { NotificationsDrawer } from "./NotificationsDrawer";

// Phase 5 — specialized components
export { Timeline } from "./Timeline";
export { LiveIndicator } from "./LiveIndicator";
export { OnboardingCard } from "./OnboardingCard";
export { InlineEdit } from "./InlineEdit";
export { DiffView } from "./DiffView";
export { JsonView } from "./JsonView";
export { SortableList } from "./SortableList";
