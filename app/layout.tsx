import type { Metadata } from "next";
import { ClientMonitoring } from "@/app/components/ClientMonitoring";
import "./globals.css";

export const metadata: Metadata = {
  title: "Perceptual Image Color Analyzer",
  description: "A web application that analyzes the colors in an image and provides a perceptual color palette based on the most dominant colors. Built with Next.js, TypeScript, and Tailwind CSS, using a lightweight color quantization algorithm to extract the most representative colors from the image.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <ClientMonitoring />
        {children}
      </body>
    </html>
  );
}
