import { Button } from "./button.jsx"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import React from "react"
import { describe, test } from "vitest"

describe("@components/button", () => {
  test("should render", async ({ expect }) => {
    render(<Button />)
  })
})
