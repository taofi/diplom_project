// src/app/[lang]/layout.tsx
import type { Metadata } from "next";
import { Noto_Sans, Pinyon_Script } from "next/font/google";
import "../globals.css"; // Путь изменен, так как файл теперь глубже на один уровень
import { Providers } from "@/components/Providers";
import { notFound } from "next/navigation";
import { Locale } from "@/context/i18n/types";
import { Header } from "@/components/Header";

const notoSans = Noto_Sans({
  variable: "--font-noto-sans",
  subsets: ["latin"],
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
  style: ["normal", "italic"],
});

const pinyonScript = Pinyon_Script({
  variable: "--font-pinyon-script",
  subsets: ["latin"],
  weight: "400",
});

export const metadata: Metadata = {
  title: "NADZIN",
  description: "NADZIN - сайт художника",
};

export async function generateStaticParams() {
  return [{ lang: 'en' }, { lang: 'ru' }];
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;

  // Проверка валидности языка
  if (lang !== 'en' && lang !== 'ru') {
    notFound();
  }

  const validLang = lang as Locale;

  return (
    <html lang={validLang}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Noto+Sans:ital,wght@0,100..900;1,100..900&family=Pinyon+Script&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className={`mx-20 ${notoSans.variable} ${pinyonScript.variable}`}>
        
        <Providers initialLocale={validLang}>
          <Header/>
          {children}
        </Providers>
      </body>
    </html>
  );
}
