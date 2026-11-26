export function productImageUrl(image: string): string {
  const value = image.trim()
  if (!value || /^(?:[a-z][a-z\d+.-]*:|\/\/|\/)/i.test(value)) return value
  return `/${value}`
}
