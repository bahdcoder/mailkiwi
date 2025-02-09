import { ComposeBroadcastProvider } from "./state/compose_broadcast_context.jsx"
import { ComposeBroadcastTopBar } from "@/pages/components/flows/compose_broadcast/compose_broadcast_top_bar.jsx"
import { useSyncComposerContentToServer } from "@/pages/components/flows/compose_broadcast/hooks/use_sync_composer_content_to_server.js"
import { StepsRenderer } from "@/pages/components/flows/steps_renderer.jsx"
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

  const syncContentToServerMutation = useSyncComposerContentToServer()

  return (
    <ComposeBroadcastProvider syncContentToServerMutation={syncContentToServerMutation}>
      <div className="DialogContent w-screen h-screen px-2 pb-2 box-border kb-background-secondary fixed overflow-y-auto top-[50%] left-[50%] -translate-x-1/2 -translate-y-1/2 focus:outline-none duration-300 ease-out z-[2]">
        <div className="flex flex-col">
          <ComposeBroadcastTopBar />
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
      </div>
    </ComposeBroadcastProvider>
  )
}
