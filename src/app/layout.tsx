import type { Metadata, Viewport } from "next";
import { Onest } from "next/font/google";
import type { ReactNode } from "react";
import "./globals.css";

const onest = Onest({ subsets: ["latin"], weight: ["400", "500", "600", "700"], variable: "--font-onest" });

export const metadata: Metadata = {
  title: "ENGLISH QUEST",
  description: "생활 속 상황 미션으로 영어 대화를 연습하는 학습 웹앱",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0a0a0a",
  // Lets the chat input stay above the mobile keyboard.
  interactiveWidget: "resizes-content",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ko" className={`${onest.variable} h-full`}>
      <body className="min-h-full">{children}</body>
    </html>
  );
}
