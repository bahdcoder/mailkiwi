import { FilterCondition } from "@/pages/w/letters/subscribers/components/filters.jsx"

export function encodeFiltersToUrl(filters: FilterCondition[]): string {
  return filters
    .map((filter, index) => {
      const field = `filters[${index}][field]=${filter.field}`
      const operation = `filters[${index}][operation]=${filter.operation}`
      const value = Array.isArray(filter.value)
        ? filter.value.map((val) => `filters[${index}][value][]=${val}`).join("&")
        : `filters[${index}][value]=${filter.value}`
      return [field, operation, value].join("&")
    })
    .join("&")
}

export function decodeFiltersFromUrl(queryString: string): FilterCondition[] {
  const urlParams = new URLSearchParams(queryString)
  const filters: FilterCondition[] = []

  const filterIndexes = Array.from(
    new Set(
      Array.from(urlParams.keys())
        .map((key) => key.match(/^filters\[(\d+)\]/)?.[1])
        .filter(Boolean), // Remove null values
    ),
  )

  filterIndexes.forEach((index) => {
    const field = urlParams.get(`filters[${index}][field]`) as FilterCondition["field"]
    const operation = urlParams.get(
      `filters[${index}][operation]`,
    ) as FilterCondition["operation"]
    const values = urlParams.getAll(`filters[${index}][value][]`)
    const value =
      values.length > 0
        ? isNaN(Number(values[0]))
          ? values
          : values.map(Number)
        : urlParams.get(`filters[${index}][value]`)

    if (field && operation && value !== null) {
      filters.push({
        id: Math.random().toString(36).slice(2),
        field,
        operation,
        value: Array.isArray(value)
          ? value
          : isNaN(Number(value))
            ? value
            : Number(value),
      })
    }
  })

  return filters
}
