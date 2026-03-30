import path from "path";

/**
 * Husky runs `lint-staged --no-stash` (see `.husky/pre-commit`). On Windows, lint-staged's
 * default git stash backup fails for Next.js App Router paths containing `[]` or `()`
 * because Git treats them as pathspec globs.
 *
 * Prettier CLI v3 rejects paths containing `[` or `(` as "negative glob patterns" because
 * micromatch treats them as glob special chars during ignore-file matching — even with
 * --ignore-path pointing to an empty file.
 *
 * Fix: use a dedicated Node script (scripts/prettier-lint-staged.mjs) that calls the
 * Prettier Node API directly, bypassing CLI glob matching entirely.
 *
 * @type {import('lint-staged').Configuration}
 */

function toRelPosix(absPath) {
  return path.relative(process.cwd(), absPath).replace(/\\/g, "/");
}

const config = {
  "*.{ts,tsx,js,jsx,json,css,md}": (filenames) => {
    const rel = filenames.map(toRelPosix).map((f) => `"${f}"`).join(" ");
    return [`node scripts/prettier-lint-staged.mjs ${rel}`];
  },
  "*.{ts,tsx,js,jsx}": (filenames) => {
    const rel = filenames.map(toRelPosix).map((f) => `"${f}"`).join(" ");
    return [`eslint --fix ${rel}`];
  },
};

export default config;
