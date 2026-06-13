'use client';
import dynamic from 'next/dynamic';

// R3F can't SSR — load the dot client-only.
const GlassDotClient = dynamic(() => import('./GlassDot'), {
  ssr: false,
  loading: () => null,
});

export default GlassDotClient;
