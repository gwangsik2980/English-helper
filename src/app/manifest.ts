import type { MetadataRoute } from "next";

/** Lets phones add the app to the home screen as "QUEST" and open it full screen. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "ENGLISH QUEST",
    short_name: "QUEST",
    description: "생활 속 상황 미션으로 영어 대화를 연습하는 학습 웹앱",
    lang: "ko",
    start_url: "/",
    display: "standalone",
    background_color: "#04050c",
    theme_color: "#04050c",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
