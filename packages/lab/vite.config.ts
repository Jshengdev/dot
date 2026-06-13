import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// The lab imports the FROZEN token sheet directly from ../../design so there is a
// single source of truth (no copy, no drift). That path is outside the lab root,
// so we relax Vite's fs guard to the repo root.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5180,
    open: true,
    fs: { strict: false },
  },
});
