# DOT on Railway — ONE persistent service: the Next.js app (conversation UI + the
# whole engine API) with the scheduler running INSIDE it 24/7 (instrumentation.ts,
# gated on DOT_SCHEDULER_INLINE). pnpm monorepo: install the full workspace, build
# only @dot/flow-proto (it transpiles @dot/backend), then `next start`.
#
# Full node image (not -slim) so any dep with a native step installs cleanly.
FROM node:20-bookworm AS app
RUN corepack enable
WORKDIR /app

# Install the whole workspace. NODE_ENV is unset here on purpose — flow-proto needs
# its devDeps (next, typescript, tailwind, postcss) to build.
COPY . .
RUN pnpm install --frozen-lockfile=false

# Build the Next app. No keys/env needed at build — the engine is imported lazily at
# request/boot time, never at module load, so the build never touches Grok/Neon.
RUN pnpm --filter @dot/flow-proto build

# Runtime: production + inline scheduler on. Railway injects PORT; the start script
# binds to it (next start -p ${PORT:-5175}).
ENV NODE_ENV=production
ENV DOT_SCHEDULER_INLINE=1
CMD ["pnpm", "--filter", "@dot/flow-proto", "start"]
