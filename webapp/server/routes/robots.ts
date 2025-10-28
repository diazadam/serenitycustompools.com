import type { Request, Response } from "express";

export function generateRobots(req: Request, res: Response) {
  const baseUrl = "https://serenitycustompools.com";
  
  const robots = `# Serenity Custom Pools LLC Robots.txt
# Last updated: ${new Date().toISOString().split('T')[0]}

# Allow all search engines
User-agent: *
Allow: /
Disallow: /api/
Disallow: /admin/
Disallow: /crm/
Disallow: /affiliate/dashboard
Disallow: /*.json$
Disallow: /*?*utm_
Disallow: /*?*ref=

# Specific search engines
User-agent: Googlebot
Allow: /
Crawl-delay: 0

User-agent: Bingbot
Allow: /
Crawl-delay: 1

User-agent: Slurp
Allow: /
Crawl-delay: 1

# Block bad bots
User-agent: AhrefsBot
Disallow: /

User-agent: SemrushBot
Disallow: /

User-agent: DotBot
Disallow: /

User-agent: MJ12bot
Disallow: /

# Sitemap location
Sitemap: ${baseUrl}/sitemap.xml

# Contact information
# Contact: info@serenitycustompools.com`;

  res.header('Content-Type', 'text/plain');
  res.send(robots);
}