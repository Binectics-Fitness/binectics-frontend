export default function ConditionalLayout({
  children,
}: {
  children: React.ReactNode;
}) {

  // Every page and not-found handle their own chrome (MarketingTopbar, dashboard shells, etc.)
  // The legacy Navbar/Footer wrapper is no longer used.
  return <div id="main-content">{children}</div>;
}
