import { TextSizeIcon } from '#root/pages/components/icons/text-size.svg.jsx'
import * as SelectField from '@kibamail/owly/select-field'
import * as Tabs from '@kibamail/owly/tabs'
import { Text } from '@kibamail/owly/text'
import * as TextField from '@kibamail/owly/text-field'
import { type Editor, findParentNode } from '@tiptap/core'
import { useEditorState } from '@tiptap/react'

export interface BlockEditorProps {
  editor: Editor
}

export function BlockEditor({ editor }: BlockEditorProps) {
  const nodeStyles = useEditorState({
    editor,
    selector(ctx) {
      const { selection } = ctx.editor.state
      const parentBlock = findParentNode((node) => node.type.isBlock)(selection)

      return (parentBlock?.node?.attrs?.styles || {}) as Record<string, string>
    },
  })

  const applyStyle = (property: string, value: string) => {
    const { selection } = editor.state

    // Find the closest parent block node
    const parentBlock = findParentNode((node) => node.type.isBlock)(selection)

    if (!parentBlock) {
      return false
    }

    const { node, pos } = parentBlock
    const currentStyles = node.attrs.styles || {}

    // Update the parent block's attributes
    editor
      .chain()
      .updateAttributes(node.type.name, {
        styles: {
          ...currentStyles,
          [property]: value,
        },
      })
      .run()
  }

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
            type="text"
            value={nodeStyles.padding || ''}
            onChange={(event) => {
              applyStyle('padding', event.target.value)
            }}
          >
            <TextField.Label>Padding</TextField.Label>
          </TextField.Root>
        </div>

        <div className="py-4">
          <SelectField.Root
            onValueChange={(value) => {
              applyStyle('text-align', value)
            }}
            value={nodeStyles['text-align']}
          >
            <SelectField.Label>Text Align</SelectField.Label>
            <SelectField.Trigger placeholder="Select alignment" />
            <SelectField.Content className="z-3">
              {['left', 'center', 'right', 'justify'].map((align) => (
                <SelectField.Item key={align} value={align}>
                  {align}
                </SelectField.Item>
              ))}
            </SelectField.Content>
          </SelectField.Root>
        </div>
        <div className="py-4">
          <TextField.Root
            type="number"
            onChange={(event) => {
              const value = event.target.value

              applyStyle('font-size', `${value}px`)
            }}
          >
            <TextField.Label>Font size</TextField.Label>
            <TextField.Slot side="left">
              <TextSizeIcon className="w-4 h-4" />
            </TextField.Slot>
            <TextField.Slot side="right">
              <Text className="text-(--content-disabled)">px</Text>
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
            <SelectField.Content className="z-3">
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
