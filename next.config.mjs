/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // Linting is wired up (.eslintrc.json + CI), but not a build gate yet:
    // the repo's eslint-disable comments reference @typescript-eslint rules
    // whose plugin isn't installed. Re-enable once that dep + a lint pass land.
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Types are clean (npx tsc --noEmit is green) and gated in CI, so the
    // build enforces them too. This flag was masking 190 errors.
    ignoreBuildErrors: false,
  },
  images: {
    unoptimized: true,
  },
}

export default nextConfig
