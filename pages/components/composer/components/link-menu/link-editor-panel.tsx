import { LinkIcon } from "@/pages/components/icons/link.svg.jsx"
import { Text } from "@kibamail/owly/text"
import * as TextField from "@kibamail/owly/text-field"
import * as Popover from "@radix-ui/react-popover"
import { Editor } from "@tiptap/core"
import cn from "classnames"
import React, { PropsWithChildren } from "react"

const linkPresets = [
  {
    name: "Contact unsubscribe",
  },
  {
    name: "Contact preferences",
  },
]

export interface LinkEditorPanelProps extends PropsWithChildren {
  editor: Editor
  initialUrl?: string
}

export function LinkEditorPanel({ editor, initialUrl, children }: LinkEditorPanelProps) {
  const [isOpen, setIsOpen] = React.useState(false)
  const [isInvalidUrl, setIsInvalidUrl] = React.useState(false)

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const href = new FormData(event.target as HTMLFormElement).get("url") as string

    if (
      !/((([A-Za-z]{3,9}:(?:\/\/)?)(?:[-;:&=\+\$,\w]+@)?[A-Za-z0-9.-]+|(?:www.|[-;:&=\+\$,\w]+@)[A-Za-z0-9.-]+)((?:\/[\+~%\/.\w-_]*)?\??(?:[-\+=&;%@.\w_]*)#?(?:[\w]*))?)/.test(
        href,
      )
    ) {
      setIsInvalidUrl(true)
      return
    }

    setIsInvalidUrl(false)

    if (initialUrl) {
      editor.chain().focus().extendMarkRange("link").setLink({ href: href }).run()
    } else {
      editor.chain().focus().setLink({ href }).setUnderline().run()
    }

    setIsOpen(false)
  }

  return (
    <Popover.Root open={isOpen} onOpenChange={setIsOpen}>
      <Popover.Trigger
        asChild
        className={cn(
          "w-6 h-6 flex cursor-pointer transition-[background-color] duration-100 ease-in-out items-center justify-center rounded-md",
          {
            "bg-white bg-opacity-[0.08] text-white": false,
            "hover:bg-white hover:bg-opacity-[0.08] text-[var(--content-tertiary-inverse)]":
              true,
          },
        )}
      >
        {children}
      </Popover.Trigger>

      <Popover.Content
        align="center"
        sideOffset={10}
        className="z-50 w-60 overflow-hidden border kb-border-tertiary rounded-xl p-1 shadow-[0px_16px_24px_-8px_var(--black-10)] data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 bg-[var(--background-primary)]"
      >
        <form onSubmit={onSubmit} method="post" action="">
          <TextField.Root
            placeholder="Paste or type a link"
            name="url"
            defaultValue={initialUrl}
          >
            {isInvalidUrl ? (
              <TextField.Error>Please enter a valid url.</TextField.Error>
            ) : null}
          </TextField.Root>
        </form>

        <div className="flex flex-col gap-1 pt-1">
          {linkPresets.map((preset) => (
            <button
              key={preset.name}
              className="flex items-center w-full h-8 box-border p-2 gap-1 hover:bg-[var(--background-secondary)] cursor-pointer rounded-lg"
            >
              <Text>{preset.name}</Text>
            </button>
          ))}
        </div>
      </Popover.Content>
    </Popover.Root>
  )
}
