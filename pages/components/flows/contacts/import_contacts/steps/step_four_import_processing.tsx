import { Button } from '@kibamail/owly/button'
import { Heading } from '@kibamail/owly/heading'
import { Text } from '@kibamail/owly/text'
import * as Dialog from '@radix-ui/react-dialog'
import * as React from 'react'

export function StepFourImportProcessing() {
  return (
    <div className="pt-10 lg:pt-24 flex flex-col gap-y-2">
      <Dialog.Title asChild className="text-left">
        <Heading>We're processing your import.</Heading>
      </Dialog.Title>

      <Dialog.Description asChild>
        <Text as="p">
          It usually takes 3 to 10 minutes, depending on the size of your list. We'll
          shoot you an email as soon as it's done.
        </Text>
      </Dialog.Description>

      <div className="mt-6 flex items-center justify-between">
        <Dialog.Close asChild>
          <Button>Finish</Button>
        </Dialog.Close>
      </div>
    </div>
  )
}
