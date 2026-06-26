import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "فروشگاه آنلاین الینا",
    short_name: "الینا",
    description: "فروشگاه آنلاین پوشاک زنانه الینا",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#6e3fd5",
    lang: "fa-IR",
    dir: "rtl",
    icons: [
      {
        src: "/elina/elina-logo-full.png",
        sizes: "1254x1254",
        type: "image/png",
        purpose: "any",
      },
    ],
  };
}
