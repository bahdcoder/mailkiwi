import { TextSizeIcon } from "@/pages/components/icons/text-size.svg.jsx"
import * as SelectField from "@kibamail/owly/select-field"
import * as Tabs from "@kibamail/owly/tabs"
import { Text } from "@kibamail/owly/text"
import * as TextField from "@kibamail/owly/text-field"
import { Editor } from "@tiptap/core"
import { Node, ResolvedPos } from "@tiptap/pm/model"
import { NodeSelection } from "@tiptap/pm/state"
import { useEditorState } from "@tiptap/react"

export interface BlockEditorProps {
  editor: Editor
}

export function BlockEditor({ editor }: BlockEditorProps) {
  const tree = useEditorHierarchyTree(editor)

  return (
    <div className="p-2">
      <Tabs.Root defaultValue="mobile" width="full">
        <Tabs.List>
          <Tabs.Trigger value="mobile">Mobile</Tabs.Trigger>
          <Tabs.Trigger value="desktop">Desktop</Tabs.Trigger>
          <Tabs.Indicator />
        </Tabs.List>
      </Tabs.Root>

      <div className="flex flex-col w-full gap-4">
        <div className="py-4">
          <TextField.Root
            type="number"
            onChange={(event) => {
              const value = event.target.value

              editor.chain().setFontSize(`${value}px`).run()
            }}
          >
            <TextField.Label>Font size</TextField.Label>
            <TextField.Slot side="left">
              <TextSizeIcon className="w-4 h-4" />
            </TextField.Slot>
            <TextField.Slot side="right">
              <Text className="text-[var(--content-disabled)]">px</Text>
            </TextField.Slot>
          </TextField.Root>
        </div>

        <div className="py-4">
          <SelectField.Root
            onValueChange={(value) => {
              editor.chain().focus().setFontSize(value).run()
            }}
          >
            <SelectField.Label>Font size</SelectField.Label>
            <SelectField.Trigger placeholder="Select a font size" />
            <SelectField.Content className="z-[3]">
              {[10, 12, 14, 16, 18, 20, 22, 24, 26, 28, 30, 32, 34, 36].map(
                (fontSize) => (
                  <SelectField.Item key={fontSize} value={`${fontSize}px`}>
                    {fontSize}px
                  </SelectField.Item>
                ),
              )}
            </SelectField.Content>
          </SelectField.Root>
        </div>
      </div>
    </div>
  )
}

export function useEditorHierarchyTree(editor: Editor) {
  return useEditorState({
    editor,
    selector(ctx) {
      const nodes: {
        node: Node
        position: number
        hasChildren: boolean
        resolvedPosition: ResolvedPos
      }[] = []

      const doc = ctx.editor.state.doc

      doc.descendants(function (node, position) {
        const pos = doc.resolve(position)
        nodes.push({
          node,
          position,
          resolvedPosition: doc.resolve(position),
          hasChildren: node.content.childCount > 0,
        })

        return true
      })

      function selectNode(position: number) {
        const { state, dispatch } = ctx.editor.view

        const transaction = state.tr.setSelection(
          NodeSelection.create(state.doc, position),
        )

        dispatch(transaction)

        ctx.editor.view.focus()
      }

      const activeNode = ctx.editor.state.doc.resolve(ctx.editor.state.selection.from)

      return { doc, nodes, selectNode, activeNode: activeNode.nodeAfter }
    },
  })
}
