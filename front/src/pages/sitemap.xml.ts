import type { APIRoute } from 'astro'
import { getCategories, listProducts } from '@/infrastructure/container'

const escapeXml = (value: string) =>
  value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&apos;')

export const GET: APIRoute = async ({ request }) => {
  const origin = new URL(request.url).origin
  const [categories, products] = await Promise.all([
    getCategories.execute(),
    listProducts.execute(),
  ])
  const urls = [
    `${origin}/`,
    ...categories.map((category) => `${origin}/categoria/${encodeURIComponent(category.id)}`),
    ...products.map((product) => `${origin}/producto/${encodeURIComponent(product.id)}`),
  ]
  const body = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...urls.map((url) => `<url><loc>${escapeXml(url)}</loc></url>`),
    '</urlset>',
  ].join('')

  return new Response(body, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  })
}
