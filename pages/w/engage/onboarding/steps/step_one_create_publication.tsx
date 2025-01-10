import { useOnboardingContext } from "./context_provider.jsx"
import { ArrowLeftIcon } from "@/pages/components/icons/arrow-left.svg.jsx"
import {
  ServerForm,
  useServerFormMutation,
} from "@/pages/components/server-form-mutation/hooks/use-server-form-mutation.jsx"
import { slugify } from "@/pages/utils/slugify.js"
import { Button } from "@kibamail/owly/button"
import { Heading } from "@kibamail/owly/heading"
import { Progress } from "@kibamail/owly/progress"
import { Text } from "@kibamail/owly/text"
import * as TextField from "@kibamail/owly/text-field"
import { createContext } from "@radix-ui/react-context"
import React from "react"
import { usePageContext } from "vike-react/usePageContext"

import { route } from "@/shared/routes/route_aliases.js"

export function CreatePublicationStep() {
  const ctx = usePageContext()
  const { step, setStep, setFormState } = useOnboardingContext("CreatePublicationStep")

  const { serverFormProps, isPending, error } = useServerFormMutation<{ id: string }>({
    action: route("audience_create"),
    onSuccess(response) {
      setStep((current) => current + 1)
      setFormState((current) => ({ ...current, audienceId: response.payload.id }))
    },
  })

  if (step !== 0) {
    return null
  }

  return (
    <ServerForm {...serverFormProps}>
      <Heading size="sm">Create your publication</Heading>
      <Text className="kb-content-tertiary" as="label" htmlFor="slug">
        Set a unique url for your publication
      </Text>

      <input type="hidden" name="product" value={"letters"} />

      <div className="flex items-center mt-6 gap-x-2">
        <TextField.Root
          autoFocus
          id="slug"
          name="slug"
          defaultValue={slugify(ctx.team?.name || "")}
        >
          {error?.errorsMap?.slug ? (
            <TextField.Error>{error.errorsMap.slug}</TextField.Error>
          ) : null}
        </TextField.Root>
        <Text>.kibasites.com</Text>
      </div>

      <Button type="submit" loading={isPending} className="mt-6">
        Continue
      </Button>
    </ServerForm>
  )
}
