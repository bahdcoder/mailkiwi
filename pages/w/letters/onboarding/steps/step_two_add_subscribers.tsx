import { useOnboardingContext } from "./context_provider.jsx"
import { ButtonCard } from "@/pages/components/button/button-card.jsx"
import { ImportContactsDialog } from "@/pages/components/flows/contacts/import_contacts/import_contacts_flow.jsx"
import { Button } from "@kibamail/owly/button"
import { Heading } from "@kibamail/owly/heading"
import { Text } from "@kibamail/owly/text"

export function AddSubscribersStep() {
  const { step, setStep, formState } = useOnboardingContext("CreatePublicationStep")

  function goToNextStep() {
    setStep((current) => current + 1)
  }

  if (step !== 1) {
    return null
  }

  return (
    <div>
      <Heading size="sm">Add subscribers</Heading>
      <Text className="kb-content-tertiary" as="label" htmlFor="slug">
        Bring your existing subscribers to your Kibamail Letters account.
      </Text>

      <div className="flex flex-col gap-y-4 mt-6">
        <ButtonCard>
          <Text size="lg" className="font-semibold text-left">
            Add subscribers manually
          </Text>
          <Text className="text-left">
            Add a single subscriber by entering their name and email.
          </Text>
        </ButtonCard>

        <ImportContactsDialog
          audienceId={formState.audienceId}
          onImportCompleted={goToNextStep}
        >
          <ButtonCard>
            <Text size="lg" className="font-semibold text-left">
              Upload subscriber list
            </Text>
            <Text className="text-left">
              Upload a csv to add multiple subscribers at once.
            </Text>
          </ButtonCard>
        </ImportContactsDialog>
      </div>

      <Button variant="tertiary" className="mt-6" onClick={goToNextStep}>
        Skip for now
      </Button>
    </div>
  )
}
