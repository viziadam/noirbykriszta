import { Playfair_Display, Poppins, Cormorant_Garamond, Parisienne } from "next/font/google";
import "./globals.css";

const playfair = Playfair_Display({
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600"],
  variable: "--font-playfair",
  display: "swap",
});
const poppins = Poppins({
  subsets: ["latin", "latin-ext"],
  weight: ["300", "400", "500"],
  variable: "--font-poppins",
  display: "swap",
});
const cormorant = Cormorant_Garamond({
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600"],
  variable: "--font-cormorant",
  display: "swap",
});
const parisienne = Parisienne({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-script",
  display: "swap",
});

// Szerver-oldali érték, futásidőben olvasva — a domain váltásához elég a
// SITE_URL env módosítása + újraindítás, nem kell újraépíteni.
const SITE_URL =
  process.env.SITE_URL || process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export const metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "NOIR By Kriszta – Szempilla Építés és Szemöldök Lamináció Pécelen",
    template: "%s – NOIR By Kriszta",
  },
  description:
    "Prémium szempilla építés (1D/2D/3D/hibrid), szempilla töltés és szemöldök lamináció Pécelen és Budapesten. Higiénikus, allergiatesztelt anyagok. Foglalj időpontot online.",
  keywords: [
    "szempilla építés Pécel",
    "szempilla építés Budapest",
    "szempillahosszabbítás Pécel",
    "szemöldök lamináció Pécel",
    "szemöldök szedés Pécel",
    "lash stylist Pécel",
  ],
  openGraph: {
    type: "website",
    locale: "hu_HU",
    siteName: "NOIR By Kriszta",
    title: "NOIR By Kriszta – Lash Stylist Pécelen",
    description:
      "Prémium szempilla építés és szemöldök-formázás Pécelen és Budapesten. Természetes, tartós eredmény.",
  },
  robots: { index: true, follow: true },
};

export const viewport = {
  themeColor: "#132A22",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="hu"
      className={`${playfair.variable} ${poppins.variable} ${cormorant.variable} ${parisienne.variable}`}
    >
      <body>{children}</body>
    </html>
  );
}
