import type { Metadata } from "next";
import { Noto_Sans, Pinyon_Script } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Noto+Sans:ital,wght@0,100..900;1,100..900&family=Pinyon+Script&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className={`mx-20  ${notoSans.variable} ${pinyonScript.variable}`}>
        <Providers>
          <div className="container ">
            <Header />
            <main className="">
              {children}
            </main>
          </div>
        </Providers>
      </body>
    </html>
  );
}
