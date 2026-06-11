// Design System v2 — Primitives
// All components follow shared.css tokens from the Binectics design prototype

// Async states
export { AsyncSpinner, EmptySlate } from "./AsyncStates";
export { NavigationProgress, startNavigationProgress } from "./NavigationProgress";

// Phase 1 — core primitives
export { Eyebrow } from "./Eyebrow";
export { StatusDot } from "./StatusDot";
export { FilterPill } from "./FilterPill";
export { DSCard, DSCardHead } from "./DSCard";
export { DSStatCard } from "./DSStatCard";
export { DSBadge } from "./DSBadge";
export { DSTable, DSTableHead, DSTableTh, DSTableRow, DSTableTd } from "./DSTable";
export { DashboardTopbar } from "./DashboardTopbar";

// Phase 2 — booking + provider patterns
export { StatusPill } from "./StatusPill";
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
