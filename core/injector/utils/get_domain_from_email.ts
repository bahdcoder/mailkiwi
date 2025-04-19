export function getDomainFromEmail(email: string) {
  return email?.split('@')?.[1]
}
