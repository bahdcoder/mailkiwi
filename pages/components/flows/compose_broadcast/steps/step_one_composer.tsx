import "./styles.css"
import { Composer } from "@/pages/components/composer/composer.jsx"
import { useTiptapEditor } from "@/pages/components/composer/editor-state.jsx"
import { useSyncComposerContentToServer } from "@/pages/components/flows/compose_broadcast/hooks/use_sync_composer_content_to_server.js"
import { useComposeBroadcastContext } from "@/pages/components/flows/compose_broadcast/state/compose_broadcast_context.jsx"
import { Spinner } from "@kibamail/owly/spinner"
import { usePageContext } from "vike-react/usePageContext"

interface EditorSaveState {
  isSaving: boolean
  isError: boolean
  errorMessage: string | undefined
  lastSavedSuccessfullyAt: Date | undefined
}
interface StepOneComposerProps {
  onEditorSaveStateChanged: (state: Partial<EditorSaveState>) => void
}

export function StepOneComposer() {
  const ctx = usePageContext()

  const { syncContentToServerMutation } = useComposeBroadcastContext("StepOneComposer")

  const { editor } = useTiptapEditor({
    onUpdate({ editor }) {
      syncContentToServerMutation.mutate({
        emailContent: { contentJson: editor.getJSON() },
      })
    },
    content: ctx.pageProps.broadcast?.emailContent?.contentJson,
  })

  if (!editor) {
    return (
      <div className="flex justify-center items-center py-12">
        <Spinner size="lg" />
      </div>
    )
  }

  return <Composer editor={editor} />
}
