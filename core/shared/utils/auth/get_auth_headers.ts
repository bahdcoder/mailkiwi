export function getAuthenticationHeaders(apiKey: string) {
  return {
    Authorization: `Bearer ${apiKey}`,
  }
}
