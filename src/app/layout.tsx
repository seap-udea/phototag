import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Pregrado UdeA 2025",
  description: "Pregrado de Astronomía - UdeA (2025): ¡16 años cumplidos!",
  icons: {
    icon: '/astrologo.png',
    shortcut: '/astrologo.png',
    apple: '/astrologo.png',
  },
  openGraph: {
    title: "Pregrado UdeA 2025",
    description: "Pregrado de Astronomía - UdeA (2025): ¡16 años cumplidos!",
    images: [
      {
        url: '/astrologo.png',
        width: 512,
        height: 512,
        alt: 'Pregrado de Astronomía UdeA',
      },
    ],
    locale: 'es_ES',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: "Pregrado UdeA 2025",
    description: "Pregrado de Astronomía - UdeA (2025): ¡16 años cumplidos!",
    images: ['/astrologo.png'],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
