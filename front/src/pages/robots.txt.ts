import type { APIRoute } from 'astro'

export const GET: APIRoute = ({ request }) => {
  const origin = new URL(request.url).origin
  const body = [
    'User-agent: *',
    'Allow: /',
    'Disallow: /dashboard',
    'Disallow: /carrito',
    'Disallow: /checkout',
    'Disallow: /login',
    'Disallow: /registro',
    'Disallow: /mis-compras',
    `Sitemap: ${origin}/sitemap.xml`,
    '',
  ].join('\n')

  return new Response(body, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  })
}
