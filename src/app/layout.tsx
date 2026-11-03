import type { Metadata, Viewport } from "next";
import { Galada, Onest } from "next/font/google";
import type { ReactNode } from "react";
import { FluidBackground } from "@/features/ui/FluidBackground";
import { NoPinchZoom } from "@/features/ui/NoPinchZoom";
import "./globals.css";

// Onest carries the type (Lumora structure, Flowstate mood); Galada is the accent script.
const onest = Onest({ subsets: ["latin"], weight: ["400", "500", "600", "700"], variable: "--font-onest" });
const galada = Galada({ subsets: ["latin"], weight: "400", variable: "--font-galada" });

export const metadata: Metadata = {
  title: "ENGLISH QUEST",
  description: "생활 속 상황 미션으로 영어 대화를 연습하는 학습 웹앱",
  // iPhone Safari reads the home screen name and full-screen mode from these tags, not the manifest.
  appleWebApp: { capable: true, title: "QUEST", statusBarStyle: "black" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  // Pinch zoom would scale and push the fixed header and bottom bar like
  // any page content; the app behaves like a native app instead (user request).
  maximumScale: 1,
  userScalable: false,
  themeColor: "#04050c",
  // Lets the chat input stay above the mobile keyboard.
  interactiveWidget: "resizes-content",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ko" className={`${onest.variable} ${galada.variable} h-full`}>
      <body className="min-h-full">
        <FluidBackground />
        <NoPinchZoom />
        {children}
      </body>
    </html>
  );
}
