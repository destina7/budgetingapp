import type { Metadata, Viewport } from "next";
import "./globals.css";
import Nav from "@/components/Nav";

export const metadata: Metadata = {
  title: "Budget",
  description: "Personal budget planner",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#f6f5f2",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full flex flex-col antialiased">
        <div className="mx-auto w-full max-w-2xl flex-1 px-4 pb-24 pt-6 sm:px-6">
          {children}
        </div>
        <Nav />
      </body>
    </html>
  );
}
