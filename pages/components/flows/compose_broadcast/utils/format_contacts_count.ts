export function formatContactsCount(count: number) {
  const intl = new Intl.NumberFormat("en-US", {
    style: "decimal",
  })

  return intl.format(count)
}
