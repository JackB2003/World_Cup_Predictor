import type { Metadata } from "next";
import { Archivo, Bebas_Neue, Hanken_Grotesk } from "next/font/google";
import { ThemeProvider } from "@/components/providers/theme-provider";
import "./globals.css";

const archivo = Archivo({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["700", "800", "900"],
});

const hanken = Hanken_Grotesk({
  subsets: ["latin"],
  variable: "--font-body",
  weight: ["400", "500", "600", "700"],
});

const bebas = Bebas_Neue({
  subsets: ["latin"],
  variable: "--font-num",
  weight: "400",
});

export const metadata: Metadata = {
  title: "PitchIQ — World Cup 2026 Predictor",
  description: "AI-powered pre-match World Cup predictions",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-theme="dark" suppressHydrationWarning>
      <body className={`${archivo.variable} ${hanken.variable} ${bebas.variable} font-[family-name:var(--font-body)] antialiased`}>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
