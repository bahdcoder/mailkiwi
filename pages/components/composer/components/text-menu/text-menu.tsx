import { LinkEditorPanel } from "@/pages/components/composer/components/link-menu/link-editor-panel.jsx"
import { ContentTypeSelector } from "@/pages/components/composer/components/text-menu/content-type-selector.jsx"
import { useTextmenuStates } from "@/pages/components/composer/components/text-menu/use-text-menu-states.js"
import { BoldIcon } from "@/pages/components/icons/bold.svg.jsx"
import { CodeBlockIcon } from "@/pages/components/icons/codeblock.svg.jsx"
import { ItalicIcon } from "@/pages/components/icons/italic.svg.jsx"
import { LinkIcon } from "@/pages/components/icons/link.svg.jsx"
import { NavArrowDownIcon } from "@/pages/components/icons/nav-arrow-down.svg.jsx"
import { StrikeThroughIcon } from "@/pages/components/icons/strikethrough.svg.jsx"
import { UnderlineIcon } from "@/pages/components/icons/underline.svg.jsx"
import { BubbleMenu, Editor } from "@tiptap/react"
import cn from "classnames"
import React from "react"
import "tippy.js/animations/scale.css"

export interface TextMenuProps {
  editor: Editor
}

type TextMenuAction = {
  id: string
  name: string
  icon: React.ReactNode
  command: (editor: Editor) => void
}

const textMenuActions: TextMenuAction[] = [
  {
    id: "bold",
    name: "Bold",
    icon: <BoldIcon className="w-4 h-4" />,
    command(editor) {
      return editor.chain().focus().toggleBold().run()
    },
  },
  {
    id: "italic",
    name: "Italic",
    icon: <ItalicIcon className="w-4 h-4" />,
    command(editor) {
      return editor.chain().focus().toggleItalic().run()
    },
  },
  {
    id: "underline",
    name: "Underline",
    icon: <UnderlineIcon className="w-[17px] h-[17px]" />,
    command(editor) {
      return editor.chain().focus().toggleUnderline().run()
    },
  },
  {
    id: "strike",
    name: "Strike through",
    icon: <StrikeThroughIcon className="w-3 h-3" />,
    command(editor) {
      return editor.chain().focus().toggleStrike().run()
    },
  },
  {
    id: "code",
    name: "Code",
    icon: <CodeBlockIcon className="w-4 h-4" />,
    command(editor) {
      editor
        .chain()
        .focus()
        .toggleCode()
        .updateAttributes("code", {
          styles: {
            "background-color": "var(--black-5)",
            color: "var(--content-primary)",
            "border-radius": "4px",
            padding: "2px 4px",
            "font-family": "monospace",
          },
        })
        .run()
    },
  },
]

export function TextMenu({ editor }: TextMenuProps) {
  const { shouldShow } = useTextmenuStates(editor)

  if (!editor) {
    return null
  }

  return (
    <BubbleMenu
      editor={editor}
      tippyOptions={{
        popperOptions: {
          placement: "top-start",
          modifiers: [
            {
              name: "preventOverflow",
              options: {
                boundary: "viewport",
                padding: 8,
              },
            },
            {
              name: "flip",
              options: {
                fallbackPlacements: ["bottom-start", "top-end", "bottom-end"],
              },
            },
          ],
        },
        maxWidth: "calc(100vw - 16px)",
      }}
      pluginKey="textMenu"
      shouldShow={shouldShow}
      updateDelay={100}
    >
      <div
        className="flex items-center bg-[var(--background-inverse)] gap-0.5 box-border rounded-lg p-1 shadow[0px_2px_0px_0px_var(--white-5)_inset,_0px_1px_0px_0px_var(--black-10)]
      "
      >
        <div className="flex box-border border-r border-[var(--white-10)] pr-1">
          <ContentTypeSelector editor={editor} />
        </div>

        {textMenuActions.map((action) => (
          <button
            key={action.name}
            onClick={() => action.command(editor)}
            className={cn(
              "w-6 h-6 flex cursor-pointer transition-[background-color] duration-100 ease-in-out items-center justify-center rounded-md",
              {
                "bg-white bg-opacity-[0.08] text-white": editor.isActive(action.id),
                "hover:bg-white hover:bg-opacity-[0.08] text-[var(--content-tertiary-inverse)]":
                  !editor.isActive(action.id),
              },
            )}
            aria-label={action.name}
          >
            {action.icon}
          </button>
        ))}

        <div className="flex box-border border-l border-[var(--white-10)] px-1">
          <LinkEditorPanel editor={editor}>
            <button>
              <LinkIcon className="w-4 h-4" />
            </button>
          </LinkEditorPanel>
        </div>
      </div>
    </BubbleMenu>
  )
}
