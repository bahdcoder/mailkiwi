export function isDateInPast(input: string | number): boolean {
  return new Date(input) < new Date()
}

export function addSecondsToDate(date: Date, seconds: number) {
  return new Date(date.getTime() + seconds * 1000)
}

export function differenceInSeconds(firstDate: Date, secondDate: Date) {
  const firstTime = firstDate.getTime()
  const secondTime = secondDate.getTime()

  const differenceInMilliseconds = Math.abs(secondTime - firstTime)

  const differenceInSeconds = Math.floor(differenceInMilliseconds / 1000)

  return differenceInSeconds
}
