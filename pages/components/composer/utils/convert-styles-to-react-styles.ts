export function convertToReactStyles(cssStyles: Record<string, string>) {
  const reactStyles: Record<string, string> = {}

  for (const [key, value] of Object.entries(cssStyles)) {
    // Convert CSS property names to camelCase
    const reactKey = key.replace(/-([a-z])/g, (match, letter) => letter.toUpperCase())

    // Assign the value to the new key
    reactStyles[reactKey] = value
  }

  return reactStyles
}
