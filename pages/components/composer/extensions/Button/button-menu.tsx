import {
  FillPanel,
  FillValue,
} from "@/pages/components/composer/components/fill-panel/fill-panel.jsx"
import { LinkEditorPanel } from "@/pages/components/composer/components/link-menu/link-editor-panel.jsx"
import {
  ToolbarButton,
  ToolbarContainer,
  ToolbarSection,
  getToolbarClassNames,
} from "@/pages/components/composer/components/toolbar/toolbar.jsx"
import { CompAlignCenterIcon } from "@/pages/components/icons/comp-align-center.svg.jsx"
import { CompAlignLeftIcon } from "@/pages/components/icons/comp-align-left.svg.jsx"
import { CompAlignRightIcon } from "@/pages/components/icons/comp-align-right.svg.jsx"
import { FillColorIcon } from "@/pages/components/icons/fill-color.svg.jsx"
import { FullWidthIcon } from "@/pages/components/icons/full-width.svg.jsx"
import { LinkIcon } from "@/pages/components/icons/link.svg.jsx"
import { OpenNewWindowIcon } from "@/pages/components/icons/open-new-window.svg.jsx"
import { TrashIcon } from "@/pages/components/icons/trash.svg.jsx"
import { BubbleMenu, Editor } from "@tiptap/react"
import React, { useCallback } from "react"
import "tippy.js/animations/scale.css"

export interface ButtonMenuProps {
  editor: Editor
  appendTo?: React.RefObject<any>
}

type ButtonMenuAction = {
  id: string
  name: string
  icon: React.ReactNode
  command: (editor: Editor) => void
  hidden?: (editor: Editor) => boolean
}

const buttonMenuActions: ButtonMenuAction[] = [
  {
    id: "left-align",
    name: "Left align",
    icon: <CompAlignLeftIcon className="w-4 h-4" />,
    command(editor) {
      // todo: align left
      editor.chain().focus().setButtonStyles("text-align", "left").run()
    },
  },
  {
    id: "center-align",
    name: "Center align",
    icon: <CompAlignCenterIcon className="w-4 h-4" />,
    command(editor) {
      editor.chain().focus().setButtonStyles("text-align", "center").run()
    },
  },
  {
    id: "right-align",
    name: "Right align",
    icon: <CompAlignRightIcon className="w-4 h-4" />,
    command(editor) {
      editor.chain().focus().setButtonStyles("text-align", "right").run()
    },
  },
]

export function ButtonMenu({ editor, appendTo }: ButtonMenuProps) {
  const { isFullWidth, isLeftAlign, isCenterAlign, isRightAlign, isFilled } =
    useButtonMenuStates(editor)

  const shouldShow = useCallback(() => {
    return editor?.isActive("button")
  }, [editor])

  if (!editor) {
    return null
  }

  const button = editor.state.selection.$anchor.node()

  function onValidUrlSubmitted(href: string) {
    editor
      .chain()
      .focus()
      .updateAttributes("button", {
        href: href,
      })
      .run()
  }

  const currentButtonHref = button?.attrs?.href

  function onDeleteNode() {
    // todo: delete node
    const pos = editor.state.selection.$anchor.pos

    editor
      .chain()
      .focus()
      .command(({ tr }) => {
        const node = tr.selection.$anchor.node()
        if (node.type.name === "button") {
          tr.delete(tr.selection.$anchor.before(), tr.selection.$anchor.after())
          return true
        }
        return false
      })
      .run()
  }

  function onBackgroundUpdated(fill: FillValue) {
    if (fill.type === "color") {
      editor
        .chain()
        .setButtonStyles("background-color", fill.value ?? "transparent")
        .run()
    }
  }

  return (
    <BubbleMenu
      editor={editor}
      tippyOptions={{
        appendTo() {
          return appendTo?.current
        },
        popperOptions: {
          placement: "top",
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
      pluginKey="buttonMenu"
      shouldShow={shouldShow}
      updateDelay={100}
    >
      <ToolbarContainer>
        {buttonMenuActions
          .filter((action) =>
            action?.hidden === undefined ? true : !action?.hidden(editor),
          )
          .map((action) => (
            <ToolbarButton
              key={action.name}
              aria-label={action.name}
              onClick={() => action.command(editor)}
            >
              {action.icon}
            </ToolbarButton>
          ))}

        <ToolbarSection divider="both">
          <ToolbarButton
            isActive={isFullWidth}
            onClick={() =>
              isFullWidth
                ? editor.chain().focus().setButtonStyles("width", "fit-content").run()
                : editor.chain().focus().setButtonStyles("width", "100%").run()
            }
          >
            <FullWidthIcon className="w-4 h-4" />
          </ToolbarButton>
        </ToolbarSection>

        <ToolbarSection divider="right">
          <FillPanel
            onChange={onBackgroundUpdated}
            value={button.attrs.styles?.["background-color"]}
          >
            <button className={getToolbarClassNames(isFilled)}>
              <FillColorIcon className="w-4 h-4" />
            </button>
          </FillPanel>
        </ToolbarSection>

        <ToolbarSection divider="right">
          <LinkEditorPanel onSubmit={onValidUrlSubmitted} initialUrl={currentButtonHref}>
            <button>
              <LinkIcon className="w-4 h-4" />
            </button>
          </LinkEditorPanel>

          {currentButtonHref ? (
            <a href={currentButtonHref} rel="noreferrer nofollow" target="_blank">
              <ToolbarButton as="span">
                <OpenNewWindowIcon className="w-3 h-3" />
              </ToolbarButton>
            </a>
          ) : null}
        </ToolbarSection>

        <ToolbarSection divider="none">
          <ToolbarButton onClick={onDeleteNode}>
            <TrashIcon className="w-3 h-3" />
          </ToolbarButton>
        </ToolbarSection>
      </ToolbarContainer>
    </BubbleMenu>
  )
}

export function useButtonMenuStates(editor: Editor) {
  const isInsideButton = editor.isActive("button")
  const button = editor.state.selection.$anchor.node()
  const styles = button.attrs.styles

  return {
    isInsideButton,
    isFilled: styles?.["background-color"] !== undefined,
    isFullWidth: styles?.["width"] === "100%",
    isLeftAlign: styles?.["text-align"] === "left",
    isRightAlign: styles?.["text-align"] === "right",
    isCenterAlign: styles?.["text-align"] === "center",
  }
}
