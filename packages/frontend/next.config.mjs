/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // The frozen token sheet lives at ../../design/tokens.css (single source of truth,
  // no copy/drift). It is imported into app/globals.css; Next bundles it fine since
  // it's a plain CSS import resolved relative to this package.

  // @dot/backend is a TS-only workspace package with no build step, and its runtime
  // deps (ai / @ai-sdk/xai / zod) live only in packages/backend/node_modules — NOT
  // resolvable from the app root. So we TRANSPILE it: webpack compiles its TS and
  // resolves those deps from the backend's own node_modules (the only place they
  // exist). The repo-root .env still loads — the route's ensureEnv() reads it before
  // importing the backend, so XAI_API_KEY is set regardless of how grok.ts resolves.
  transpilePackages: ['@dot/backend'],

  // macOS file-watcher relief: the dev watcher hit EMFILE (too many open files)
  // recursively watching node_modules, which intermittently broke Next's route
  // collection. Stop watching node_modules / .next so the route tree is discovered
  // reliably. (Dev-only ergonomics; no effect on the production build.)
  webpack: (config, { dev }) => {
    if (dev) {
      config.watchOptions = {
        ...config.watchOptions,
        ignored: ['**/node_modules/**', '**/.next/**'],
      };
    }
    // @dot/backend is ESM-style TS: its relative imports carry the '.js' extension
    // (correct for Node ESM + the backend's "moduleResolution: Bundler"). When we
    // TRANSPILE it, webpack must map those '.js' specifiers back to the real '.ts'
    // source. extensionAlias is the webpack-5 way to do exactly that.
    config.resolve = config.resolve ?? {};
    config.resolve.extensionAlias = {
      ...config.resolve.extensionAlias,
      '.js': ['.ts', '.tsx', '.js', '.jsx'],
    };
    return config;
  },
};

export default nextConfig;
