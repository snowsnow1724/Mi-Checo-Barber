import type { CatalogRepository } from '@/application/ports/CatalogRepository'
import type { Category } from '@/domain/catalog/Category'
import type { Product } from '@/domain/catalog/Product'
import { productImageUrl } from '@/domain/catalog/productImageUrl'
import type { GraphqlClient } from '@/infrastructure/graphql/client'
import {
  QUERY_CATEGORIES,
  QUERY_CATEGORY_BY_ID,
  QUERY_PRODUCT_BY_ID,
  QUERY_PRODUCTS,
} from '@/infrastructure/graphql/queries'

type CategoryDTO = Omit<Category, 'products'> & { products?: Omit<Product, 'category'>[] }

const normalizeProductImage = <T extends { img: string }>(product: T): T => ({
  ...product,
  img: productImageUrl(product.img),
})

export class GraphqlCatalogRepository implements CatalogRepository {
  private readonly cacheTtlMs = 30_000
  private readonly categoriesCache: { value: Category[]; expiresAt: number } = {
    value: [],
    expiresAt: 0,
  }
  private readonly categoryCache = new Map<string, { value: Category | null; expiresAt: number }>()
  private readonly productCache = new Map<string, { value: Product | null; expiresAt: number }>()
  private readonly productsCache = new Map<string, { value: Product[]; expiresAt: number }>()

  constructor(private readonly gql: GraphqlClient) {}

  async listCategories(): Promise<Category[]> {
    if (this.categoriesCache.expiresAt > Date.now()) {
      return this.categoriesCache.value
    }
    const res = await this.gql<{ categories: CategoryDTO[] }>(QUERY_CATEGORIES)
    const categories = res.categories.map((c) => ({ ...c, products: [] }))
    this.categoriesCache.value = categories
    this.categoriesCache.expiresAt = Date.now() + this.cacheTtlMs
    return categories
  }

  async findCategoryById(id: string): Promise<Category | null> {
    const cached = this.categoryCache.get(id)
    if (cached && cached.expiresAt > Date.now()) return cached.value

    const res = await this.gql<{ category: CategoryDTO | null }>(QUERY_CATEGORY_BY_ID, { id })
    const c = res.category
    if (!c) {
      this.categoryCache.set(id, { value: null, expiresAt: Date.now() + this.cacheTtlMs })
      return null
    }
    const ref = { id: c.id, name: c.name }
    const category = {
      ...c,
      products: (c.products ?? []).map((p) => ({ ...normalizeProductImage(p), category: ref })),
    }
    this.categoryCache.set(id, { value: category, expiresAt: Date.now() + this.cacheTtlMs })
    return category
  }

  async listProducts(params: { limit?: number; offset?: number } = {}): Promise<Product[]> {
    const key = `${params.limit ?? ''}:${params.offset ?? ''}`
    const cached = this.productsCache.get(key)
    if (cached && cached.expiresAt > Date.now()) return cached.value

    const res = await this.gql<{ products: Product[] }>(QUERY_PRODUCTS, params)
    const products = res.products.map(normalizeProductImage)
    this.productsCache.set(key, { value: products, expiresAt: Date.now() + this.cacheTtlMs })
    return products
  }

  async findProductById(id: string): Promise<Product | null> {
    const cached = this.productCache.get(id)
    if (cached && cached.expiresAt > Date.now()) return cached.value

    const res = await this.gql<{ product: Product | null }>(QUERY_PRODUCT_BY_ID, { id })
    const product = res.product ? normalizeProductImage(res.product) : null
    this.productCache.set(id, { value: product, expiresAt: Date.now() + this.cacheTtlMs })
    return product
  }
}
