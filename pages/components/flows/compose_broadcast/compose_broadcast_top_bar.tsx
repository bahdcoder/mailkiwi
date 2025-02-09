import { useComposeBroadcastContext } from "./state/compose_broadcast_context.jsx"
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
        <Button variant="secondary" className="rounded-full">
          Compose
        </Button>

        <MinusIcon className="text-[var(--border-tertiary)]" />

        <Button variant="tertiary" className="rounded-full">
          Recipients
        </Button>
        <MinusIcon className="text-[var(--border-tertiary)]" />
        <Button variant="tertiary" className="rounded-full">
          Configure
        </Button>
        <MinusIcon className="text-[var(--border-tertiary)]" />
        <Button variant="tertiary" className="rounded-full">
          Preview
        </Button>
      </div>

      <div className="flex items-center gap-4">
        <Button variant="secondary">Preview</Button>
        <Button>
          Next <ArrowRightIcon />
        </Button>
      </div>
    </header>
  )
}
