import { spawn } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const nextBin = join(root, "node_modules", "next", "dist", "bin", "next");
const heapFlag = "--max-old-space-size=4096";
const currentNodeOptions = process.env.NODE_OPTIONS?.trim() ?? "";
const nodeOptions = currentNodeOptions.includes("--max-old-space-size")
  ? currentNodeOptions
  : [currentNodeOptions, heapFlag].filter(Boolean).join(" ");

const child = spawn(process.execPath, [nextBin, "build"], {
  cwd: root,
  env: {
    ...process.env,
    NODE_OPTIONS: nodeOptions,
  },
  stdio: "inherit",
});

child.on("exit", (code, signal) => {
  if (signal) {
    console.error(`next build exited with signal ${signal}`);
    process.exit(1);
  }
  process.exit(code ?? 1);
});
