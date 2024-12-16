import { useOnboardingContext } from "./context_provider.jsx"
import { ButtonCard } from "@/pages/components/button/button-card.jsx"
import { Button } from "@kibamail/owly/button"
import { Heading } from "@kibamail/owly/heading"
import { Text } from "@kibamail/owly/text"
import React from "react"
import { usePageContext } from "vike-react/usePageContext"

export function AddSubscribersStep() {
  const ctx = usePageContext()
  const { step, setStep } = useOnboardingContext("CreatePublicationStep")

  function goToNextStep() {
    setStep((current) => current + 1)
  }

  if (step !== 1) {
    return null
  }

  return (
    <div>
      <Heading variant="display">Add subscribers</Heading>
      <Text className="kb-content-tertiary" as="label" htmlFor="slug">
        Bring your existing subscribers to your Kibamail Letters account.
      </Text>

      <div className="flex flex-col gap-y-4 mt-6">
        <ButtonCard>
          <Text size="lg" className="font-semibold">
            Add subscribers manually
          </Text>
          <Text>Add a single subscriber by entering their name and email.</Text>
        </ButtonCard>
        <ButtonCard>
          <Text size="lg" className="font-semibold">
            Add subscribers manually
          </Text>
          <Text>Add a single subscriber by entering their name and email.</Text>
        </ButtonCard>
      </div>

      <Button variant="tertiary" className="mt-6" onClick={goToNextStep}>
        Skip for now
      </Button>
    </div>
  )
}
