// فحص الموقع قبل النشر: الصفحات الأساسية موجودة، الـmanifest صالح، سكربتات Service Worker سليمة نحويًا، ولا أسرار.
import { readFileSync, existsSync } from "node:fs";
import { execSync } from "node:child_process";

const problems = [];
const required = ["index.html", "404.html", "manifest.webmanifest", "sw.js", "unwani/index.html", "unwani/privacy.html", "waraqa/index.html", "tesseract/NOTICE"];
for (const f of required) if (!existsSync(f)) problems.push(`missing ${f}`);

for (const f of ["manifest.webmanifest", "unwani/manifest.json"]) {
  try { JSON.parse(readFileSync(f, "utf8")); } catch (e) { problems.push(`invalid JSON ${f}: ${e.message}`); }
}

for (const f of ["sw.js", "unwani/sw.js"]) {
  try { execSync(`node --check ${f}`, { stdio: "pipe" }); } catch (e) { problems.push(`syntax error in ${f}: ${e.stderr}`); }
}

for (const f of ["index.html", "unwani/index.html", "waraqa/index.html"]) {
  const html = readFileSync(f, "utf8");
  if (!/<title>[^<]+<\/title>/.test(html)) problems.push(`${f} has no <title>`);
  if (!/dir="rtl"/.test(html)) problems.push(`${f} is not dir="rtl"`);
}

const tracked = execSync("git ls-files", { encoding: "utf8" }).split("\n").filter((f) => /\.(html|js|mjs|json|webmanifest|md)$/.test(f) && !f.startsWith("tesseract/") && !/\.min[.-]/.test(f));
const secret = /(sk-ant-[A-Za-z0-9_-]{20,}|ghp_[A-Za-z0-9]{30,}|github_pat_[A-Za-z0-9_]{30,}|AKIA[0-9A-Z]{16}|AIza[0-9A-Za-z_-]{35}|xai-[A-Za-z0-9]{20,}|-----BEGIN (RSA |EC )?PRIVATE KEY)/;
for (const f of tracked) if (secret.test(readFileSync(f, "utf8"))) problems.push(`possible secret in ${f}`);

if (problems.length) { console.error(problems.map((p) => `✗ ${p}`).join("\n")); process.exit(1); }
console.log(`✓ site checks passed (${required.length} pages/assets, ${tracked.length} text files scanned)`);
