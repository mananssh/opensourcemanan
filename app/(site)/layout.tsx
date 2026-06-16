import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

/** Chrome for the main (Editorial) site — home, /osm, /changelog, /sign-in. */
export default function SiteLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="flex min-h-full flex-col">
      <SiteHeader />
      <div className="flex-1">{children}</div>
      <SiteFooter />
    </div>
  );
}
