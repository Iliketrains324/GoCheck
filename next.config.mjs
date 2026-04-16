/** @type {import('next').NextConfig} */
const nextConfig = {
  // pdf-parse was removed; pdfjs-dist handles extraction client-side
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              // Next.js inline scripts + React hydration
              "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
              // pdfjs worker loaded from unpkg CDN
              "worker-src blob: https://unpkg.com",
              // Supabase + OpenRouter API calls
              "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://openrouter.ai",
              // Google Fonts + Material Symbols
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com",
              "img-src 'self' data: blob:",
              "frame-ancestors 'none'",
            ].join("; "),
          },
        ],
      },
    ];
  },
};

export default nextConfig;
