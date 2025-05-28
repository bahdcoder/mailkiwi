import './styles.css'
import { Composer } from '#root/pages/components/composer/composer.jsx'
import { useTiptapEditor } from '#root/pages/components/composer/editor-state.jsx'
import { useComposeBroadcastContext } from '#root/pages/components/flows/compose_broadcast/state/compose_broadcast_context.jsx'
import { Spinner } from '@kibamail/owly/spinner'
import { usePageContext } from 'vike-react/usePageContext'
import type { BroadcastPageProps } from '#root/pages/types/broadcast-page-props.js'
import { usePageContextWithProps } from '#root/pages/hooks/use_page_props.js'

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
  const { pageProps } = usePageContextWithProps<BroadcastPageProps>()

  const { syncContentToServerMutation } = useComposeBroadcastContext('StepOneComposer')

  const { editor } = useTiptapEditor({
    onUpdate({ editor }) {
      syncContentToServerMutation.mutate({
        emailContent: { contentJson: editor.getJSON() },
      })
    },
    content: pageProps?.broadcast?.emailContent?.contentJson,
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
