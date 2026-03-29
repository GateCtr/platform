/**
 * Returns an absolute URL for app routes.
 * In production: gatectr.com → app.gatectr.com
 * In dev: returns relative path
 */
export function appUrl(path: string): string {
  const base = process.env.NEXT_PUBLIC_APP_URL;
  if (base) return `${base}${path}`;
  return path;
}
