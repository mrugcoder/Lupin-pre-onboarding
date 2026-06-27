import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Lupin Pre-Onboarding Connect",
  description:
    "Pre-Onboarding & Recruitment Automation Portal — Internal HR tool for Lupin. Manage candidates from application through joining.",
  robots: "noindex, nofollow", // internal HR tool — do not index
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full">
      <body className="h-full">{children}</body>
    </html>
  );
}
