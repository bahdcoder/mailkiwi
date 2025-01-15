import { ComposeBroadcastProvider } from "./state/compose_broadcast_context.jsx"
import { StepsRenderer } from "@/pages/components/flows/steps_renderer.jsx"
import { ArrowRightIcon } from "@/pages/components/icons/arrow-right.svg.jsx"
import { CancelIcon } from "@/pages/components/icons/cancel.svg.jsx"
import { MinusIcon } from "@/pages/components/icons/minus.svg.jsx"
import { Button } from "@kibamail/owly/button"
import * as Dialog from "@radix-ui/react-dialog"
import { FocusScope } from "@radix-ui/react-focus-scope"
import React, { PropsWithChildren } from "react"
import { clientOnly } from "vike-react/clientOnly"

const StepOneComposer = clientOnly(() =>
  import("./steps/step_one_composer.jsx").then(({ StepOneComposer }) => StepOneComposer),
)

const StepTwoRecipients = clientOnly(() =>
  import("./steps/step_two_recipients.jsx").then(
    ({ StepTwoRecipients }) => StepTwoRecipients,
  ),
)

const StepThreeConfigure = clientOnly(() =>
  import("./steps/step_three_configure.jsx").then(
    ({ StepThreeConfigure }) => StepThreeConfigure,
  ),
)

const StepFourPreview = clientOnly(() =>
  import("./steps/step_four_preview.jsx").then(({ StepFourPreview }) => StepFourPreview),
)

export interface ComposeBroadcastFlowProps {}

export function ComposeBroadcastFlow({
  children,
}: PropsWithChildren<ComposeBroadcastFlowProps>) {
  const [step, setStep] = React.useState(0)

  return (
    <ComposeBroadcastProvider>
      <Dialog.Root onOpenChange={console.log}>
        <Dialog.Trigger asChild>{children}</Dialog.Trigger>
        <Dialog.Portal>
          <FocusScope>
            <Dialog.Content className="DialogContent w-screen h-screen px-2 pb-2 box-border kb-background-secondary fixed overflow-y-auto top-[50%] left-[50%] -translate-x-1/2 -translate-y-1/2 focus:outline-none duration-300 ease-out [data-state='closed']:transform-[scale(95%)] [data-state='closed']:opacity-0 data-[state=open]:animate-[dialog-content-show_150ms_cubic-bezier(0.16,1,0.3,1)] data-[state=closed]:animate-[dialog-content-hide_100ms_cubic-bezier(0.16,1,0.3,1)] z-[100]">
              <div className="flex flex-col">
                <header className="h-[3.75rem] w-full box-border flex justify-between items-center px-2">
                  <div className="flex items-center gap-4">
                    <Dialog.Close>
                      <CancelIcon />
                    </Dialog.Close>

                    <Button variant="tertiary">Save draft</Button>
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
                <div className="flex flex-grow w-full h-[calc(100vh-4.25rem)] box-border border kb-border-tertiary rounded-xl kb-background-hover">
                  <StepsRenderer
                    current={step}
                    steps={{
                      0: StepOneComposer,
                      1: StepTwoRecipients,
                      2: StepThreeConfigure,
                      3: StepFourPreview,
                    }}
                  />
                </div>
              </div>
            </Dialog.Content>
          </FocusScope>
        </Dialog.Portal>
      </Dialog.Root>
    </ComposeBroadcastProvider>
  )
}
