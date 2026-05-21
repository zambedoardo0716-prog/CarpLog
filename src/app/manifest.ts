import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "CarpLog",
    short_name: "CarpLog",
    description: "Diario personale per il carpfishing.",
    start_url: "/",
    display: "standalone",
    background_color: "#07110e",
    theme_color: "#07110e",
  };
}
