import { ButtonCard } from '#root/pages/components/button/button-card.jsx'
import { ImportContactsDialog } from '#root/pages/components/flows/contacts/import_contacts/import_contacts_flow.jsx'
import { Button } from '@kibamail/owly/button'
import { Heading } from '@kibamail/owly/heading'
import { Text } from '@kibamail/owly/text'
import { useOnboardingContext } from './context_provider.js'

export function AddContactsStep() {
  const { step, setStep, formState } = useOnboardingContext('CreatePublicationStep')

  function goToNextStep() {
    setStep((current) => current + 1)
  }

  if (step !== 1) {
    return null
  }

  return (
    <div>
      <Heading className="font-display kb-content-brand text-xl mb-2">
        Add contacts
      </Heading>
      <Text className="kb-content-tertiary" as="label" htmlFor="slug">
        Bring your existing contacts to your Kibamail Letters account.
      </Text>

      <div className="flex flex-col gap-y-4 mt-6">
        <ButtonCard>
          <Text size="lg" className="font-semibold text-left">
            Add contacts manually
          </Text>
          <Text className="text-left">
            Add a single contact by entering their name and email.
          </Text>
        </ButtonCard>

        <ImportContactsDialog
          audienceId={formState.audienceId}
          onImportCompleted={goToNextStep}
        >
          <ButtonCard>
            <Text size="lg" className="font-semibold text-left">
              Upload contacts list
            </Text>
            <Text className="text-left">
              Upload a csv to add multiple contacts at once.
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
