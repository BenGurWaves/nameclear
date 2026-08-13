import { writeFileSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const siteUrl = process.env.VITE_SITE_URL || "https://nameclear.pages.dev";

const pages = [
  { path: "", lastmod: null, priority: "1.0" },
  { path: "/pricing", lastmod: null, priority: "0.8" },
  { path: "/about", lastmod: null, priority: "0.6" },
];

const today = new Date().toISOString().slice(0, 10);

const urls = pages
  .map(
    (p) =>
      `  <url>\n    <loc>${siteUrl}${p.path}</loc>\n    <lastmod>${p.lastmod ?? today}</lastmod>\n    <priority>${p.priority}</priority>\n  </url>`,
  )
  .join("\n");

const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;

const out = join(root, "public", "sitemap.xml");
mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, xml);

console.log(`SITEMAP_URL=${siteUrl}/sitemap.xml`);
