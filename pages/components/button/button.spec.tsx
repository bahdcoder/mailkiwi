import { Button } from "./button.jsx"
import { render } from "@testing-library/react"
import React from "react"
import { describe, test } from "vitest"

describe("@components/button", () => {
  test("should render", async ({ expect }) => {
    render(<Button />)
  })
})
