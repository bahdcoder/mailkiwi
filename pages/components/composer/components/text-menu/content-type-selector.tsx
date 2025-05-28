import type { ContentPickerOptions } from '#root/pages/components/composer/types/content-types.js'
import { CheckIcon } from '#root/pages/components/icons/check.svg.jsx'
import { HeadingOneIcon } from '#root/pages/components/icons/heading-one.svg.jsx'
import { HeadingThreeIcon } from '#root/pages/components/icons/heading-three.svg.jsx'
import { HeadingTwoIcon } from '#root/pages/components/icons/heading-two.svg.jsx'
import { NavArrowDownIcon } from '#root/pages/components/icons/nav-arrow-down.svg.jsx'
import { TextIcon } from '#root/pages/components/icons/text.svg.jsx'
import { Text } from '@kibamail/owly/text'
import * as Dropdown from '@radix-ui/react-dropdown-menu'
import type { Editor } from '@tiptap/core'
import { useEditorState } from '@tiptap/react'
import React from 'react'

export interface ContentTypeSelectorProps {
  editor: Editor
}

export function ContentTypeSelector({ editor }: ContentTypeSelectorProps) {
  const options = useTextmenuContentTypes(editor)

  const activeItem = React.useMemo(
    () => options.find((option) => option.type === 'option' && option.isActive()),
    [options],
  )

  return (
    <Dropdown.Root>
      <Dropdown.Trigger asChild>
        <button
          type="button"
          className="flex items-center justify-center gap-1 transition-colors duration-100 ease-in-out h-6 text-(--content-tertiary-inverse) hover:bg-white hover:text-white hover:bg-opacity-[0.08] rounded-md"
        >
          {activeItem?.icon}
          <Text className="kb-content-tertiary-inverse font-sans">
            {activeItem?.label}
          </Text>
          <NavArrowDownIcon className="w-4 h-4 -mb-0.5" />
        </button>
      </Dropdown.Trigger>
      <Dropdown.Content
        sideOffset={6}
        align="start"
        className="z-50 w-40 overflow-hidden border kb-border-tertiary rounded-xl p-1 shadow-[0px_16px_24px_-8px_var(--black-10)] data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 bg-(--background-primary) gap-1 -ml-1"
      >
        {options.map((option) => {
          if (option.type !== 'option') {
            return <div className="w-full h-px bg-(--black-5)" />
          }

          return (
            <Dropdown.CheckboxItem
              key={option.label}
              onSelect={option.onClick}
              disabled={option.disabled()}
              className="flex items-center justify-between w-full h-8 box-border p-2 gap-1 hover:bg-(--background-secondary) cursor-pointer rounded-lg"
            >
              <span className="flex items-center gap-1">
                {option.icon}
                <Text className="kb-content-secondary">{option.label}</Text>
              </span>

              {option.isActive() && <CheckIcon className="w-4 h-4" />}
            </Dropdown.CheckboxItem>
          )
        })}
      </Dropdown.Content>
    </Dropdown.Root>
  )
}

function useTextmenuContentTypes(editor: Editor) {
  return useEditorState({
    editor,
    selector(ctx) {
      return [
        {
          icon: <TextIcon className="w-4 h-4" />,
          onClick: () =>
            ctx.editor.chain().focus().liftListItem('listItem').setParagraph().run(),
          id: 'paragraph',
          disabled: () => !ctx.editor.can().setParagraph(),
          isActive: () =>
            ctx.editor.isActive('paragraph') &&
            !ctx.editor.isActive('orderedList') &&
            !ctx.editor.isActive('bulletList'),
          label: 'Paragraph',
          type: 'option',
        },
        {
          icon: <HeadingOneIcon className="w-4 h-4" />,
          onClick: () =>
            ctx.editor
              .chain()
              .focus()
              .liftListItem('listItem')
              .setHeading({ level: 1 })
              .run(),
          id: 'heading1',
          disabled: () => !ctx.editor.can().setHeading({ level: 1 }),
          isActive: () => ctx.editor.isActive('heading', { level: 1 }),
          label: 'Heading 1',
          type: 'option',
        },
        {
          icon: <HeadingTwoIcon className="w-4 h-4" />,
          onClick: () =>
            ctx.editor
              .chain()
              .focus()
              .liftListItem('listItem')
              .setHeading({ level: 2 })
              .run(),
          id: 'heading2',
          disabled: () => !ctx.editor.can().setHeading({ level: 2 }),
          isActive: () => ctx.editor.isActive('heading', { level: 2 }),
          label: 'Heading 2',
          type: 'option',
        },
        {
          icon: <HeadingThreeIcon className="w-4 h-4" />,
          onClick: () =>
            ctx.editor
              .chain()
              .focus()
              .liftListItem('listItem')
              .setHeading({ level: 3 })
              .run(),
          id: 'heading3',
          disabled: () => !ctx.editor.can().setHeading({ level: 3 }),
          isActive: () => ctx.editor.isActive('heading', { level: 3 }),
          label: 'Heading 3',
          type: 'option',
        },
        // Lists feature disabled for now
        // {
        //   type: "category",
        //   label: "Lists",
        //   id: "lists",
        // },
        // {
        //   icon: <UnorderedListIcon className="w-4 h-4" />,
        //   onClick: () =>
        //     ctx.editor.chain().focus().toggleBulletList().run(),
        //   id: "bulletList",
        //   disabled: () => !ctx.editor.can().toggleBulletList(),
        //   isActive: () => ctx.editor.isActive("bulletList"),
        //   label: "Unordered list",
        //   type: "option",
        // },
        // {
        //   icon: <NumberedListIcon className="w-4 h-4" />,
        //   onClick: () =>
        //     ctx.editor.chain().focus().toggleOrderedList().run(),
        //   id: "orderedList",
        //   disabled: () => !ctx.editor.can().toggleOrderedList(),
        //   isActive: () => ctx.editor.isActive("orderedList"),
        //   label: "Numbered list",
        //   type: "option",
        // },
      ] satisfies ContentPickerOptions
    },
  })
}
