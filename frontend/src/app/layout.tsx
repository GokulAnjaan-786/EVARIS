import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "EVARIS — Intelligence That Makes Learning Visible",
  description:
    "AI-powered real-time visual teaching engine. Turns spoken explanations into dynamic mathematical, scientific, and algorithmic visuals alongside the teacher's video.",
  keywords: [
    "EVARIS",
    "EdTech",
    "Real-time visual teaching",
    "AI teaching engine",
    "KaTeX mathematics",
    "Smart visual continuity",
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;600&family=Outfit:wght@500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
