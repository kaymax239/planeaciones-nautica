import type { Metadata } from "next";
import Link from "next/link";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "./lib/authContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Planeaciones Náuticas | ENMT",
  description:
    "Generador de documentos académicos — Escuela Náutica Mercante de Tampico",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {/* Acceso discreto a la zona de desarrollador (solo funciona para el admin). */}
        <Link
          href="/desarrollador"
          className="fixed right-3 top-2 z-50 text-[11px] font-medium text-slate-400 no-underline hover:text-slate-600 hover:underline"
        >
          Desarrollador
        </Link>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
