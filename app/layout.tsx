import type { Metadata, Viewport } from "next";
import Sw from "@/lib/sw";
import "./globals.css";

export const metadata: Metadata = {
  title: "GEOGLITCH",
  description: "Geography games, but weird.",
  appleWebApp: { capable: true, title: "GEOGLITCH", statusBarStyle: "black-translucent" },
};
export const viewport: Viewport = { themeColor: "#070a12", viewportFit: "cover" };

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en">
      <body>
        {children}
        <Sw />
      </body>
    </html>
  );
}
