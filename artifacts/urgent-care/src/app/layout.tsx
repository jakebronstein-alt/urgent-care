import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { UbieConsultPopup } from "@/components/UbieConsultPopup";

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
    default: "Urgent Care Near Me — Wait Times & Reviews | UbieHealth",
  },
  description:
    "Find urgent care clinics near you, see real-time wait times, and read reviews. Powered by UbieHealth.",
  metadataBase: new URL("https://urgentcare.ubiehealth.com"),
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${nunito.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col text-ubie-dark">
        {children}
        <UbieConsultPopup />
      </body>
    </html>
  );
}
