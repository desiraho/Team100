import { mkdir, copyFile, cp, readFile, stat } from "node:fs/promises";
import { site } from "./content.js";
const html = await readFile("index.html", "utf8");
const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map((m) => m[1]);
if (new Set(ids).size !== ids.length) throw new Error("Duplicate HTML IDs");
for (const [, id] of html.matchAll(/href="#([^"]+)"/g))
  if (!ids.includes(id)) throw new Error(`Missing anchor ${id}`);
const required = [
  "home",
  "who-we-are",
  "programs",
  "impact",
  "join-team-100",
  "contact-us",
];
const sections = [...html.matchAll(/<section id="([^"]+)"/g)].map((m) => m[1]);
if (JSON.stringify(required) !== JSON.stringify(sections))
  throw new Error("Section order differs from brief");
const assets = [...html.matchAll(/(?:src|href)="(assets\/[^"#]+)"/g)].map(
  (m) => m[1],
);
assets.push(
  ...site.photos.map((v) => v.image),
  ...site.team.filter((p) => p.image).map((p) => p.image),
);
if (site.founderVideo?.startsWith("assets/")) assets.push(site.founderVideo);
for (const asset of assets) { const info = await stat(asset); if (info.size > 25 * 1024 * 1024) throw new Error(`Asset exceeds Cloudflare Pages limit: ${asset}`); }
await mkdir("dist", { recursive: true });
for (const file of [
  "index.html",
  "styles.css",
  "app.js",
  "content.js",
  "favicon.svg",
  "_worker.js",
  "_routes.json",
])
  await copyFile(file, `dist/${file}`);
await cp("assets", "dist/assets", { recursive: true });
console.log(
  "Build passed: six ordered sections, valid anchors, unique IDs and all referenced photos present. Static output: dist/",
);

