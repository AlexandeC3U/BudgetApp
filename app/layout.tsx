import type { Metadata, Viewport } from "next";
import { Providers } from "./providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "Budget",
  description: "Bold & playful expense tracker — split, track, settle.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#F5F1E8",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-dvh bg-cream text-ink antialiased">
        <Providers>
          <div className="mx-auto max-w-md min-h-dvh relative">{children}</div>
        </Providers>
      </body>
    </html>
  );
}
