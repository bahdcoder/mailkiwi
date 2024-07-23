export function isDateInPast(input: string | number): boolean {
  return new Date(input) < new Date()
}

export function addSecondsToDate(date: Date, seconds: number) {
  return new Date(date.getTime() + seconds * 1000)
}
