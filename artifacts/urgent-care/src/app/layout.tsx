import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { UbieConsultPopup } from "@/components/UbieConsultPopup";
import { Providers } from "@/components/Providers";

const nunito = localFont({
  variable: "--font-nunito",
  display: "swap",
  src: [
    { path: "../../public/fonts/nunito/Nunito-Light.ttf",          weight: "300", style: "normal" },
    { path: "../../public/fonts/nunito/Nunito-Regular.ttf",        weight: "400", style: "normal" },
    { path: "../../public/fonts/nunito/Nunito-Medium.ttf",         weight: "500", style: "normal" },
    { path: "../../public/fonts/nunito/Nunito-SemiBold.ttf",       weight: "600", style: "normal" },
    { path: "../../public/fonts/nunito/Nunito-Bold.ttf",           weight: "700", style: "normal" },
    { path: "../../public/fonts/nunito/Nunito-ExtraBold.ttf",      weight: "800", style: "normal" },
    { path: "../../public/fonts/nunito/Nunito-Black.ttf",          weight: "900", style: "normal" },
    { path: "../../public/fonts/nunito/Nunito-Italic.ttf",         weight: "400", style: "italic" },
    { path: "../../public/fonts/nunito/Nunito-BoldItalic.ttf",     weight: "700", style: "italic" },
  ],
});

export const metadata: Metadata = {
  title: {
    template: "%s | UbieHealth",
    default: "Urgent Care Near Me — Live Wait Times & Reviews | UbieHealth",
  },
  description:
    "Find urgent care clinics near you. See live waiting room counts and estimated wait times before you leave home — free on UbieHealth.",
  metadataBase: new URL("https://ubiehealth.com"),
  robots: { index: true, follow: true },
  openGraph: {
    siteName: "UbieHealth Urgent Care",
    type: "website",
    locale: "en_US",
    url: "https://ubiehealth.com/urgentcare",
    title: "Urgent Care Near Me — Live Wait Times | UbieHealth",
    description:
      "See how many people are waiting at NYC urgent care clinics before you leave home. Free, no appointment needed.",
    images: [
      {
        url: "/urgentcare/ubie-logo-horizontal.png",
        width: 280,
        height: 113,
        alt: "UbieHealth Urgent Care",
      },
    ],
  },
  twitter: {
    card: "summary",
    title: "Urgent Care Near Me — Live Wait Times | UbieHealth",
    description:
      "See live wait times at NYC urgent care clinics before you leave home.",
  },
  icons: {
    icon: "/urgentcare/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${nunito.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col text-ubie-dark">
        <Providers>
          {children}
          <UbieConsultPopup />
        </Providers>
      </body>
    </html>
  );
}
