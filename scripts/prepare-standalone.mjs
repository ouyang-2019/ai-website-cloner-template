import { copyFileSync, existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const standalone = join(root, ".next", "standalone");

function copyIfPresent(source, target) {
  if (!existsSync(source) || !existsSync(standalone)) {
    return;
  }
  const stat = statSync(source);
  if (stat.isDirectory()) {
    mkdirSync(target, { recursive: true });
    for (const entry of readdirSync(source)) {
      copyIfPresent(join(source, entry), join(target, entry));
    }
    return;
  }
  mkdirSync(dirname(target), { recursive: true });
  copyFileSync(source, target);
}

copyIfPresent(join(root, ".next", "static"), join(standalone, ".next", "static"));
copyIfPresent(join(root, "public"), join(standalone, "public"));

console.log("Standalone static assets prepared.");

// AUBEAU: standalone server 默认端口 3000 → 3939（避开本机其他项目占用 3000）。
//         仍可用 PORT env 覆盖。每次 postbuild 后自动注入，免依赖 cross-env。
const serverJs = join(standalone, "server.js");
if (existsSync(serverJs)) {
  const original = readFileSync(serverJs, "utf8");
  const patched = original
    .replace(
      /parseInt\(process\.env\.PORT,\s*10\)\s*\|\|\s*3000\b/g,
      "parseInt(process.env.PORT, 10) || 3939"
    )
    .replace(
      /process\.env\.PORT\s*\|\|\s*3000\b/g,
      "process.env.PORT || 3939"
    );
  if (patched !== original) {
    writeFileSync(serverJs, patched);
    console.log("Standalone server default port → 3939.");
  }
}
