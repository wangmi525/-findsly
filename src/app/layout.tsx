import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Findsly - AI Customer Discovery & Outreach Platform",
  description: "Describe your ideal customer. AI finds their email, WhatsApp, Instagram, and more. Reach them all from one platform.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-white antialiased">{children}</body>
    </html>
  );
}
