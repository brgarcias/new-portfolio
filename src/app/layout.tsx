// NEXT METADATA
import type { Metadata } from "next";
// NEXT GOOGLE FONT
import { Inter } from "next/font/google";
// GLOBAL CSS
import "./globals.css";
// FONT AWESOME CONFIGS
import { config } from "@fortawesome/fontawesome-svg-core";
import "@fortawesome/fontawesome-svg-core/styles.css";
config.autoAddCss = false;
// COMPONENTS
import Header from "@/src/components/Header";
// PROVIDERS
import { Providers } from "./providers";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  manifest: "favicon/manifest.json",
  themeColor: "#ffffff",
  icons: [
    {
      rel: "icon",
      type: "image/png",
      sizes: "192x192",
      url: "public/favicon/android-icon-192x192.png",
    },
    {
      rel: "icon",
      type: "image/png",
      sizes: "32x32",
      url: "public/favicon/favicon-32x32.png",
    },
    {
      rel: "icon",
      type: "image/png",
      sizes: "96x96",
      url: "public/favicon/favicon-96x96.png",
    },
    {
      rel: "icon",
      type: "image/png",
      sizes: "16x16",
      url: "public/favicon/favicon-16x16.png",
    },
    {
      rel: "apple-touch-icon",
      sizes: "57x57",
      url: "public/favicon/apple-icon-57x57.png",
      type: "image/png",
    },
    {
      rel: "apple-touch-icon",
      sizes: "60x60",
      url: "public/favicon/apple-icon-60x60.png",
      type: "image/png",
    },
    {
      rel: "apple-touch-icon",
      sizes: "72x72",
      url: "public/favicon/apple-icon-72x72.png",
      type: "image/png",
    },
    {
      rel: "apple-touch-icon",
      sizes: "76x76",
      url: "public/favicon/apple-icon-76x76.png",
      type: "image/png",
    },
    {
      rel: "apple-touch-icon",
      sizes: "114x114",
      url: "public/favicon/apple-icon-114x114.png",
      type: "image/png",
    },
    {
      rel: "apple-touch-icon",
      sizes: "120x120",
      url: "public/favicon/apple-icon-120x120.png",
      type: "image/png",
    },
    {
      rel: "apple-touch-icon",
      sizes: "144x144",
      url: "public/favicon/apple-icon-144x144.png",
      type: "image/png",
    },
    {
      rel: "apple-touch-icon",
      sizes: "152x152",
      url: "public/favicon/apple-icon-152x152.png",
      type: "image/png",
    },
    {
      rel: "apple-touch-icon",
      sizes: "180x180",
      url: "public/favicon/apple-icon-180x180.png",
      type: "image/png",
    },
  ],
  authors: {
    name: "Bruno Garcia",
    url: "https://brgarcias-portfolio.netlify.app/",
  },
  keywords:
    "bruno-garcia, full-stack, css, next, react, javascript, typescript, html",
  title: {
    default: "Bruno Garcia — Dev. Full-Stack",
    template: "%s | Bruno Garcia — Dev. Full-Stack",
  },
  viewport: {
    initialScale: 1,
    width: "device-width",
  },
  robots: {
    index: true,
    follow: true,
  },
  description: "Bruno Garcia: An inspired Full-Stack Developer",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="js csstransitions dark">
      <head />
      <body className={inter.className}>
        <Header />

        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
