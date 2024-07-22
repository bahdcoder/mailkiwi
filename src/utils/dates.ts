export function isDateInPast(input: string | number): boolean {
  const date = new Date(input)

  const now = new Date()

  return date < now
}
