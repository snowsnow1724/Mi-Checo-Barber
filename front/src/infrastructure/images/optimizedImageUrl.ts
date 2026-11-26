import { productImageUrl } from '@/domain/catalog/productImageUrl'

const optimizedLocalImages: Record<string, string> = {
  '/aceite-barba.jpg': '/aceite-barba.webp',
  '/cera.jpg': '/cera.webp',
  '/logo.jpg': '/logo.webp',
  '/navaja.jpg': '/navaja.webp',
  '/peine.jpg': '/peine.webp',
  '/pomada.jpg': '/pomada.webp',
  '/shampoo.jpg': '/shampoo.webp',
}

export function optimizedImageUrl(image: string): string {
  const normalized = productImageUrl(image)
  return optimizedLocalImages[normalized] ?? normalized
}
