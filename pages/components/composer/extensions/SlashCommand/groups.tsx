import type { Command, Group } from './types.js'
import { getDefaultStylesForNode } from '@/pages/components/composer/themes/default-theme.js'
import { BlockQuoteIcon } from '@/pages/components/icons/blockquote.svg.jsx'
import { CodeBlockIcon } from '@/pages/components/icons/codeblock.svg.jsx'
import { ContainerIcon } from '@/pages/components/icons/container.svg.jsx'
import { HeadingOneIcon } from '@/pages/components/icons/heading-one.svg.jsx'
import { HeadingThreeIcon } from '@/pages/components/icons/heading-three.svg.jsx'
import { HeadingTwoIcon } from '@/pages/components/icons/heading-two.svg.jsx'
import { LinkIcon } from '@/pages/components/icons/link.svg.jsx'
import { MediaImageIcon } from '@/pages/components/icons/media-image.svg.jsx'
import { MinusIcon } from '@/pages/components/icons/minus.svg.jsx'
import { NumberedListIcon } from '@/pages/components/icons/numbered-list.svg.jsx'
import { UnorderedListIcon } from '@/pages/components/icons/unordered-list.svg.jsx'

export const GROUPS: Group[] = [
  {
    name: 'format',
    title: 'Format',
    commands: [
      {
        name: 'heading1',
        label: 'Heading 1',
        icon: <HeadingOneIcon className="w-4 h-4" />,
        description: 'High priority section title',
        aliases: ['h1'],
        action: (editor) => {
          editor
            .chain()
            .focus()
            .setHeading({
              level: 1,
              ...getDefaultStylesForNode('headingOne'),
            })
            .run()
        },
      },
      {
        name: 'heading2',
        label: 'Heading 2',
        icon: <HeadingTwoIcon className="w-4 h-4" />,
        description: 'Medium priority section title',
        aliases: ['h2'],
        action: (editor) => {
          editor
            .chain()
            .focus()
            .setHeading({ level: 2, ...getDefaultStylesForNode('headingTwo') })
            .run()
        },
      },
      {
        name: 'heading3',
        label: 'Heading 3',
        icon: <HeadingThreeIcon className="w-4 h-4" />,
        description: 'Low priority section title',
        aliases: ['h3'],
        action: (editor) => {
          editor
            .chain()
            .focus()
            .setHeading({
              level: 3,
              ...getDefaultStylesForNode('headingThree'),
            })
            .run()
        },
      },
      {
        name: 'bulletList',
        label: 'Bullet List',
        icon: <UnorderedListIcon className="w-4 h-4" />,
        description: 'Unordered list of items',
        aliases: ['ul'],
        action: (editor) => {
          editor.chain().focus().toggleBulletList().run()
        },
      },
      {
        name: 'numberedList',
        label: 'Numbered List',
        icon: <NumberedListIcon className="w-4 h-4" />,
        description: 'Ordered list of items',
        aliases: ['ol'],
        action: (editor) => {
          editor.chain().focus().toggleOrderedList().run()
        },
      },

      ...(false
        ? [
            {
              name: 'blockquote',
              label: 'Blockquote',
              icon: <BlockQuoteIcon className="w-4 h-4" />,
              description: 'Element for quoting',
              action: (editor) => {
                editor.chain().focus().setBlockquote().run()
              },
            } satisfies Command,
            {
              name: 'codeBlock',
              label: 'Code Block',
              icon: <CodeBlockIcon className="w-4 h-4" />,
              description: 'Code block with syntax highlighting',
              shouldBeHidden: (editor) => editor.isActive('columns'),
              action: (editor) => {
                editor.chain().focus().setCodeBlock().run()
              },
            } satisfies Command,
          ]
        : []),
    ],
  },
  {
    name: 'insert',
    title: 'Insert',
    commands: [
      ...(false
        ? [
            {
              name: 'container',
              label: 'Container',
              icon: <ContainerIcon className="w-4 h-4" />,
              description: 'A container to wrap other elements in.',
              shouldBeHidden: (editor) => false,
              action(editor) {
                editor.chain().focus().setContainer().run()
              },
            } satisfies Command,
          ]
        : []),
      {
        name: 'button',
        label: 'Button',
        icon: <LinkIcon className="w-4 h-4" />,
        description: 'A button with a link',
        shouldBeHidden: (editor) => editor.isActive('button'),
        action(editor) {
          editor.chain().focus().setButton({ href: '' }).run()
        },
      },
      {
        name: 'image',
        label: 'Image',
        icon: <MediaImageIcon className="w-4 h-4" />,
        description: 'Upload an image',
        shouldBeHidden: (editor) => editor.isActive('button'),
        action(editor) {
          editor.chain().focus().setImageUpload().run()
        },
      },
      {
        name: 'horizontalRule',
        label: 'Content break',
        icon: <MinusIcon className="w-4 h-4" />,
        aliases: ['horizontal', 'rule', 'break'],
        description: 'Add a content break',
        shouldBeHidden: (editor) => editor.isActive('horizontalRule'),
        action(editor) {
          editor.chain().focus().setHorizontalRule().run()
        },
      },
    ],
  },
]

export default GROUPS
