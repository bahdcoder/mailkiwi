import { Button } from '#root/pages/components/tiptap/ui/Button/Button.jsx'
import { Icon } from '#root/pages/components/tiptap/ui/Icon.jsx'
import { Surface } from '#root/pages/components/tiptap/ui/Surface.jsx'
import { Toggle } from '#root/pages/components/tiptap/ui/Toggle/Toggle.jsx'
import { useCallback, useMemo, useState } from 'react'

export type LinkEditorPanelProps = {
  initialUrl?: string
  initialOpenInNewTab?: boolean
  onSetLink: (url: string, openInNewTab?: boolean) => void
}

export const useLinkEditorState = ({
  initialUrl,
  initialOpenInNewTab,
  onSetLink,
}: LinkEditorPanelProps) => {
  const [url, setUrl] = useState(initialUrl || '')
  const [openInNewTab, setOpenInNewTab] = useState(initialOpenInNewTab || false)

  const onChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setUrl(event.target.value)
  }, [])

  const isValidUrl = useMemo(() => /^(\S+):(\/\/)?\S+$/.test(url), [url])

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault()
      if (isValidUrl) {
        onSetLink(url, openInNewTab)
      }
    },
    [url, isValidUrl, openInNewTab, onSetLink],
  )

  return {
    url,
    setUrl,
    openInNewTab,
    setOpenInNewTab,
    onChange,
    handleSubmit,
    isValidUrl,
  }
}

export const LinkEditorPanel = ({
  onSetLink,
  initialOpenInNewTab,
  initialUrl,
}: LinkEditorPanelProps) => {
  const state = useLinkEditorState({
    onSetLink,
    initialOpenInNewTab,
    initialUrl,
  })

  return (
    <Surface className="p-2">
      <form onSubmit={state.handleSubmit} className="flex items-center gap-2">
        <label className="flex items-center gap-2 p-2 rounded-lg bg-neutral-100 dark:bg-neutral-900 cursor-text">
          <Icon name="Link" className="flex-none text-black dark:text-white" />
          <input
            type="url"
            className="flex-1 bg-transparent outline-none min-w-48 text-black text-sm dark:text-white"
            placeholder="Enter URL"
            value={state.url}
            onChange={state.onChange}
          />
        </label>
        <Button
          variant="primary"
          buttonSize="small"
          type="submit"
          disabled={!state.isValidUrl}
        >
          Set Link
        </Button>
      </form>
      <div className="mt-3">
        <div className="flex items-center justify-start gap-2 text-sm font-semibold cursor-pointer select-none text-neutral-500 dark:text-neutral-400">
          <span id="toggle-label">Open in new tab</span>
          <Toggle
            active={state.openInNewTab}
            onChange={state.setOpenInNewTab}
            aria-labelledby="toggle-label"
          />
        </div>
      </div>
    </Surface>
  )
}
