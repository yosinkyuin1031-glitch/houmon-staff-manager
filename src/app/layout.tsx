import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "訪問鍼灸スタッフ管理",
  description: "訪問鍼灸のスタッフ・患者・スケジュール管理アプリ",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body className="antialiased bg-gray-50 text-gray-900">
        {children}
      </body>
    </html>
  );
}
