import type { MetadataRoute } from "next";
import { ARTICOLI } from "../lib/guide";

const BASE = "https://estratti-conto.vercel.app";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: `${BASE}/`, changeFrequency: "weekly", priority: 1 },
    { url: `${BASE}/guide`, changeFrequency: "weekly", priority: 0.7 },
    ...ARTICOLI.map((a) => ({ url: `${BASE}/guide/${a.slug}`, lastModified: a.data, changeFrequency: "monthly" as const, priority: 0.6 })),
    { url: `${BASE}/privacy`, changeFrequency: "yearly", priority: 0.2 },
  ];
}
