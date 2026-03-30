/**
 * Prettier formatter for lint-staged that bypasses CLI glob issues with
 * Next.js App Router paths containing `[` and `(` on Windows.
 *
 * Usage: node scripts/prettier-lint-staged.mjs file1 file2 ...
 */
import prettier from "prettier";
import { readFile, writeFile } from "fs/promises";
import path from "path";

const files = process.argv.slice(2);

await Promise.all(
  files.map(async (f) => {
    const abs = path.resolve(f);
    const src = await readFile(abs, "utf8");
    const cfg = await prettier.resolveConfig(abs);
    const out = await prettier.format(src, { ...cfg, filepath: abs });
    if (out !== src) {
      await writeFile(abs, out, "utf8");
      console.log(`formatted: ${f}`);
    }
  }),
);
