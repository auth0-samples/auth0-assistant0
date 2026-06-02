import withLlamaIndex from 'llamaindex/next';
import withBundleAnalyzer from '@next/bundle-analyzer';

const nextConfig = withBundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
})({
  serverExternalPackages: ['pdf-parse'],
});

export default withLlamaIndex(nextConfig);
