import { AppProviders } from '@/providers';
import "@/styles/globals.css";
import type { Metadata } from "next";
import localFont from "next/font/local";
import { PreferencesSync } from "@/common/components/preferences-sync";

const notoSans = localFont({
  src: "../public/fonts/noto-sans-latin.woff2",
  variable: "--font-noto-sans",
  display: "swap",
});

const notoDevanagari = localFont({
  src: "../public/fonts/noto-sans-devanagari.woff2",
  variable: "--font-noto-devanagari",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Revenue Court's Computerized Management System",
  description:
    "Official portal for filing property-related cases in Revenue Courts of Uttarakhand. Citizens can register disputes, track case status, upload documents, and monitor hearing updates digitally.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}): React.JSX.Element {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${notoSans.variable} ${notoDevanagari.variable} font-sans antialiased scroll-smooth`}
        suppressHydrationWarning
      >
        <AppProviders>
          <PreferencesSync />
          {children}
        </AppProviders>
      </body>
    </html>
  );
}
