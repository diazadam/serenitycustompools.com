import type { Request, Response } from "express";

export function generateSitemap(req: Request, res: Response) {
  const baseUrl = "https://serenitycustompools.com";
  const currentDate = new Date().toISOString().split('T')[0];
  
  const urls = [
    { loc: "/", priority: 1.0, changefreq: "daily" },
    { loc: "/affiliate", priority: 0.9, changefreq: "weekly" },
    { loc: "/affiliate/register", priority: 0.8, changefreq: "monthly" },
    { loc: "/affiliate/dashboard", priority: 0.7, changefreq: "weekly" },
    { loc: "/affiliate/agreement", priority: 0.6, changefreq: "yearly" },
    { loc: "/crm", priority: 0.7, changefreq: "daily" },
    { loc: "/admin", priority: 0.5, changefreq: "daily" },
    { loc: "/admin/affiliates", priority: 0.5, changefreq: "daily" },
    { loc: "/privacy-policy", priority: 0.3, changefreq: "yearly" },
    { loc: "/terms-of-service", priority: 0.3, changefreq: "yearly" },
    { loc: "/communication-consent", priority: 0.3, changefreq: "yearly" }
  ];

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9
        http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd">
${urls.map(url => `  <url>
    <loc>${baseUrl}${url.loc}</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>${url.changefreq}</changefreq>
    <priority>${url.priority}</priority>
  </url>`).join('\n')}
</urlset>`;

  res.header('Content-Type', 'application/xml');
  res.send(sitemap);
}