"use client";

import UnifiedNavbar from "./UnifiedNavbar";

interface MarketingTopbarProps {
  activeLabel?: string;
  links?: { href: string; label: string }[];
}

export function MarketingTopbar(_props: MarketingTopbarProps = {}) {
  return <UnifiedNavbar />;
}
