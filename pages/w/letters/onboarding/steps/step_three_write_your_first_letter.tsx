import { useOnboardingContext } from "./context_provider.jsx"
import { Button } from "@kibamail/owly/button"
import { Heading } from "@kibamail/owly/heading"
import { Text } from "@kibamail/owly/text"
import React from "react"

import { route } from "@/shared/routes/route_aliases.js"

export function WriteYourFirstLetterStep() {
  const { step } = useOnboardingContext("CreatePublicationStep")

  if (step !== 2) {
    return null
  }

  return (
    <div>
      <Heading variant="display">Write your first letter</Heading>
      <Text className="kb-content-tertiary" as="label" htmlFor="slug">
        Experience the Letters editor, and begin writing your first letter.
      </Text>

      <div className="flex items-center justify-between">
        <Button className="mt-6" asChild>
          <a href={route("letters")}>Write a letter</a>
        </Button>
        <Button variant="tertiary" className="mt-6" asChild>
          <a href={route("letters")}>Skip for now</a>
        </Button>
      </div>
    </div>
  )
}
