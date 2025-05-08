export function removeTrailingSlash(path: string) {
  let pathWithoutSlash = path

  if (path.endsWith('/')) {
    pathWithoutSlash = path.slice(0, -1)
  }

  if (path.startsWith('/')) {
    pathWithoutSlash = path.slice(1)
  }

  return pathWithoutSlash
}
