/**
 * Husky runs `lint-staged --no-stash` (see `.husky/pre-commit`). On Windows, lint-staged’s
 * default git stash backup fails for Next.js App Router paths containing `[]` or `()`
 * because Git treats them as pathspec globs.
 *
 * @type {import('lint-staged').Configuration}
 */
const config = {
  "*.{ts,tsx,js,jsx,json,css,md}": ["prettier --write"],
  "*.{ts,tsx,js,jsx}": ["eslint --fix"],
};

export default config;
