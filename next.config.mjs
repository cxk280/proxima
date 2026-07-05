/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Self-contained server bundle (.next/standalone) so the app host can run
  // `node server.js` without node_modules or a build step — small footprint,
  // no OOM on a 1GB instance, and no private-repo pull on the box. See deploy/.
  output: "standalone",
};

export default nextConfig;
