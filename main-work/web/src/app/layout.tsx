import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "StartHack 2026 - Materials Analytics",
  description: "AI-powered data analytics assistant for materials testing.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
