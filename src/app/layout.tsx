import type { Metadata } from "next";
import { LenisProvider } from "@/components/LenisProvider";
import { Playfair_Display, Space_Mono } from "next/font/google";
import "@/styles/globals.css";

const spaceMono = Space_Mono({
  variable: "--font-space-mono",
  subsets: ["latin"],
  weight: ["400", "700"],
});

const playfairDisplay = Playfair_Display({
  variable: "--font-playfair-display",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Somnia | Decode & Design",
  description:
    "An immersive WebGL journey through paranoia, overthinking, and surrender into morning sleep.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${spaceMono.variable} ${playfairDisplay.variable} text-white antialiased`}
      >
        <LenisProvider>{children}</LenisProvider>
      </body>
    </html>
  );
}
