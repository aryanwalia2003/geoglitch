import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "GEOGLITCH",
    short_name: "GEOGLITCH",
    description: "Geography games, but weird.",
    start_url: "/",
    display: "standalone",
    background_color: "#070a12",
    theme_color: "#070a12",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
