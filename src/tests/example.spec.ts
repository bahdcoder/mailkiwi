import { describe,test } from "vitest"

describe("Example", () => {
  test("can add two numbers", ({ expect }) => {
    expect(2 + 3).toEqual(5)
  })
})
