import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "GoCheck — CSO Document Checker",
  description:
    "AI-powered pre-activity document checker for DLSU Manila student organizations. Catch errors in your AFORM, PPR, and other CSO documents before submission.",
  keywords: ["DLSU", "CSO", "document checker", "pre-acts", "AFORM", "PPR", "GoCheck"],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Manrope:wght@200..800&family=Inter:wght@100..900&display=swap"
          rel="stylesheet"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen flex flex-col bg-surface text-on-surface font-body">
        {children}
      </body>
    </html>
  );
}
