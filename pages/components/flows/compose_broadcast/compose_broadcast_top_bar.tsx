import { useComposeBroadcastContext } from "./state/compose_broadcast_context.jsx"
import { ComposeBroadcastTopBarActions } from "@/pages/components/flows/compose_broadcast/compose_broadcast_top_bar_actions.jsx"
import { ComposeBroadcastSteps } from "@/pages/components/flows/compose_broadcast/compose_broadcast_types.js"
import { ArrowRightIcon } from "@/pages/components/icons/arrow-right.svg.jsx"
import { CancelIcon } from "@/pages/components/icons/cancel.svg.jsx"
import { CheckIcon } from "@/pages/components/icons/check.svg.jsx"
import { MinusIcon } from "@/pages/components/icons/minus.svg.jsx"
import { WarningCircleIcon } from "@/pages/components/icons/warning-circle-solid.svg.jsx"
import { Button } from "@kibamail/owly/button"
import { Spinner } from "@kibamail/owly/spinner"
import React from "react"

import { route } from "@/shared/routes/route_aliases.js"

export function ComposeBroadcastTopBar() {
  const {
    syncContentToServerMutation: { isSuccess, isPending, isError },
    validateBroadcastEmailContentMutation,
    step,
    setStep,
  } = useComposeBroadcastContext("ComposeBroadcastTopBar")

  return (
    <header className="h-[3.75rem] w-full box-border flex justify-between items-center px-2">
      <div className="flex items-center gap-4">
        <Button variant="tertiary" className="p-0" asChild>
          <a href={route("broadcasts")}>
            <CancelIcon className="!w-6 !h-6" />
          </a>
        </Button>

        <Button variant="tertiary" disabled={isPending}>
          Save draft
          {isSuccess && !isPending && !isError ? (
            <CheckIcon className="kb-content-positive !w-5 !h-5" />
          ) : null}
          {isPending ? <Spinner size="md" /> : null}
          {isError ? <WarningCircleIcon /> : null}
        </Button>
      </div>
      <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-3">
        <Button
          variant={step === ComposeBroadcastSteps.COMPOSE ? "secondary" : "tertiary"}
          className="rounded-full"
          onClick={() => setStep(ComposeBroadcastSteps.COMPOSE)}
        >
          Compose
        </Button>

        <MinusIcon className="text-[var(--border-tertiary)]" />

        <Button
          variant={step === ComposeBroadcastSteps.CONTACTS ? "secondary" : "tertiary"}
          className="rounded-full"
          onClick={() => setStep(ComposeBroadcastSteps.CONTACTS)}
        >
          Contacts
        </Button>
        <MinusIcon className="text-[var(--border-tertiary)]" />
        <Button
          variant={step === ComposeBroadcastSteps.CONFIGURE ? "secondary" : "tertiary"}
          className="rounded-full"
          onClick={() => setStep(ComposeBroadcastSteps.CONFIGURE)}
        >
          Configure
        </Button>
        <MinusIcon className="text-[var(--border-tertiary)]" />
        <Button
          variant={step === ComposeBroadcastSteps.PREVIEW ? "secondary" : "tertiary"}
          className="rounded-full"
          onClick={() => setStep(ComposeBroadcastSteps.PREVIEW)}
        >
          Preview
        </Button>
      </div>

      <ComposeBroadcastTopBarActions />
    </header>
  )
}
