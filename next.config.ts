import type { NextConfig } from 'next';
import withSerwistInit from '@serwist/next';

const withSerwist = withSerwistInit({
  swSrc: 'app/sw.ts',
  swDest: 'public/sw.js',
  // Disable in development to avoid stale caches during rapid iteration.
  disable: process.env.NODE_ENV === 'development',
});

const config: NextConfig = {
  reactStrictMode: true,
  typedRoutes: true,
};

export default withSerwist(config);
