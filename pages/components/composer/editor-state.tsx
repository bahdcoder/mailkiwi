"use client"

import { editorExtensions } from "@/pages/components/composer/extensions.jsx"
import { ExtensionKit } from "@/pages/components/composer/extensions/extension-kit.js"
import { enableKeyboardNavigation } from "@harshtalks/slash-tiptap"
import type { JSONContent, Editor as TiptapEditor } from "@tiptap/core"
import { Color } from "@tiptap/extension-color"
import Heading from "@tiptap/extension-heading"
import ListItem from "@tiptap/extension-list-item"
import Paragraph from "@tiptap/extension-paragraph"
import Placeholder from "@tiptap/extension-placeholder"
import Text from "@tiptap/extension-text"
import TextStyle from "@tiptap/extension-text-style"
import { useEditor } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import React from "react"
import { createContext, useContext, useRef } from "react"
import { createStore } from "zustand"
import { useStoreWithEqualityFn } from "zustand/traditional"

interface EditorProps {
  editor?: TiptapEditor
  json: JSONContent

  isEditorFocused: boolean
}

interface EditorState extends EditorProps {
  setEditor: (editor: TiptapEditor | undefined) => void
  setJson: (json: JSONContent) => void

  setState: (state: Partial<EditorState>) => void
}

export type EditorStore = ReturnType<typeof createEditorStore>

const createEditorStore = (initProps?: Partial<EditorProps>) => {
  const DEFAULT_PROPS: EditorProps = {
    editor: undefined,
    json: {
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [
            {
              type: "text",
              text: "Hello World!",
            },
          ],
        },
      ],
    },

    isEditorFocused: false,
  }

  return createStore<EditorState>()((set) => ({
    ...DEFAULT_PROPS,
    ...initProps,
    setEditor(editor) {
      set(() => ({ editor }))
    },
    setJson(json) {
      set(() => ({ json }))
    },

    setState(state) {
      set(() => state)
    },
  }))
}

export const EditorContext = createContext<EditorStore | null>(null)

type EditorProviderProps = React.PropsWithChildren<Partial<EditorProps>>

export function ComposerProvider(props: EditorProviderProps) {
  const { children, ...defaultProps } = props

  const storeRef = useRef<EditorStore>()
  if (!storeRef.current) {
    storeRef.current = createEditorStore(defaultProps)
  }

  return (
    <EditorContext.Provider value={storeRef.current}>{children}</EditorContext.Provider>
  )
}

export function useEditorContext<T>(
  selector: (state: EditorState) => T,
  equalityFn?: (left: T, right: T) => boolean,
): T {
  const store = useContext(EditorContext)
  if (!store) {
    throw new Error("Missing EditorContext.Provider in the tree")
  }
  return useStoreWithEqualityFn(store, selector, equalityFn)
}

export function useTiptapEditor() {
  const {
    editor,

    setEditor,
    setJson,

    isEditorFocused,
    setState,
  } = useEditorContext((s) => s)

  useEditor({
    immediatelyRender: true,
    shouldRerenderOnTransaction: false,
    autofocus: true,
    onCreate({ editor }) {
      setEditor(editor)
    },
    onUpdate({ editor }) {
      setEditor(editor)
      setJson(editor.getJSON())
    },
    extensions: [
      // Document,
      // Text,
      // Heading,
      // Paragraph,
      ...ExtensionKit(),
      // Placeholder.configure({
      //   placeholder({ node }) {
      //     if (node.type.name === "heading") {
      //       return "Write your heading..."
      //     }

      //     return "Write something or type / to see blocks or commands"
      //   },
      //   // showOnlyWhenEditable: false,
      //   // showOnlyCurrent: false,
      //   includeChildren: true,
      // }),
      // StarterKit.configure({
      //   heading: {
      //     levels: [1, 2, 3],
      //     HTMLAttributes: {
      //       class: "relative",
      //     },
      //   },
      //   code: {
      //     HTMLAttributes: {
      //       class: "code",
      //     },
      //   },
      //   blockquote: {
      //     HTMLAttributes: {
      //       class: "kb-blockquote not-prose",
      //     },
      //   },
      //   paragraph: {
      //     HTMLAttributes: {
      //       class: "kb-paragraph",
      //     },
      //   },
      //   bulletList: {
      //     HTMLAttributes: {
      //       class: "kb-bullet-list",
      //     },
      //   },
      //   orderedList: {
      //     HTMLAttributes: {
      //       class: "kb-ordered-list",
      //     },
      //   },
      //   horizontalRule: false,
      //   dropcursor: false,
      //   document: false,
      // }),
      // ...editorExtensions,
      // Color.configure({ types: [TextStyle.name, ListItem.name] }),
      // TextStyle.configure(),
    ],
    // extensions: [
    //   Document,
    //   Text,
    //   // Paragraph,
    //   // ContainerNode,
    //   // AddBlockNode,
    //   // Heading,
    //   // Gapcursor,
    //   // Columns,
    //   // Column,
    //   // SelectNodeOnClick,
    //   // Focus.configure({
    //   //   className: "has-focus",
    //   //   mode: "shallowest",
    //   // }),
    //   // Placeholder.configure({
    //   //   placeholder({ node }) {
    //   //     if (node.type.name === "heading") {
    //   //       return "Write your heading..."
    //   //     }

    //   //     return "Type / to choose a block"
    //   //   },
    //   //   showOnlyWhenEditable: false,
    //   //   showOnlyCurrent: false,
    //   // }),
    // ],

    editorProps: {
      attributes: {
        autocomplete: "off",
        autocorrect: "off",
        autocapitalize: "off",
        class: "min-h-full bg-white shadow-sm focus:outline-none",
      },
      handleDOMEvents: {
        keydown(_view, event) {
          // prevent default event listeners from firing when slash command is active
          if (["ArrowUp", "ArrowDown", "Enter"].includes(event.key)) {
            const slashCommand = document.querySelector("#slash-command")
            if (slashCommand) {
              return true
            }
          }
        },
      },
    },
  })

  React.useEffect(() => {
    if (!editor) {
      return
    }

    editor.on("focus", function onFocus() {
      setState({
        isEditorFocused: true,
      })
    })

    editor.on("blur", function onBlur() {
      setState({
        isEditorFocused: false,
      })
    })

    return function cleanup() {
      editor.off("focus")
      editor.off("blur")
    }
  }, [editor])

  return {
    editor,
    setEditor,
    setJson,
    isEditorFocused,
  }
}
