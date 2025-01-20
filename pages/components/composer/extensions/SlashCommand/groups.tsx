import { Group } from "./types.js"
import { BlockQuoteIcon } from "@/pages/components/icons/blockquote.svg.jsx"
import { CodeBlockIcon } from "@/pages/components/icons/codeblock.svg.jsx"
import { HeadingOneIcon } from "@/pages/components/icons/heading-one.svg.jsx"
import { HeadingThreeIcon } from "@/pages/components/icons/heading-three.svg.jsx"
import { HeadingTwoIcon } from "@/pages/components/icons/heading-two.svg.jsx"
import { NumberedListIcon } from "@/pages/components/icons/numbered-list.svg.jsx"
import { UnorderedListIcon } from "@/pages/components/icons/unordered-list.svg.jsx"

export const GROUPS: Group[] = [
  {
    name: "format",
    title: "Format",
    commands: [
      {
        name: "heading1",
        label: "Heading 1",
        icon: <HeadingOneIcon className="w-4 h-4" />,
        description: "High priority section title",
        aliases: ["h1"],
        action: (editor) => {
          editor.chain().focus().setHeading({ level: 1 }).run()
        },
      },
      {
        name: "heading2",
        label: "Heading 2",
        icon: <HeadingTwoIcon className="w-4 h-4" />,
        description: "Medium priority section title",
        aliases: ["h2"],
        action: (editor) => {
          editor.chain().focus().setHeading({ level: 2 }).run()
        },
      },
      {
        name: "heading3",
        label: "Heading 3",
        icon: <HeadingThreeIcon className="w-4 h-4" />,
        description: "Low priority section title",
        aliases: ["h3"],
        action: (editor) => {
          editor.chain().focus().setHeading({ level: 3 }).run()
        },
      },
      {
        name: "bulletList",
        label: "Bullet List",
        icon: <UnorderedListIcon className="w-4 h-4" />,
        description: "Unordered list of items",
        aliases: ["ul"],
        action: (editor) => {
          editor.chain().focus().toggleBulletList().run()
        },
      },
      {
        name: "numberedList",
        label: "Numbered List",
        icon: <NumberedListIcon className="w-4 h-4" />,
        description: "Ordered list of items",
        aliases: ["ol"],
        action: (editor) => {
          editor.chain().focus().toggleOrderedList().run()
        },
      },
      {
        name: "blockquote",
        label: "Blockquote",
        icon: <BlockQuoteIcon className="w-4 h-4" />,
        description: "Element for quoting",
        action: (editor) => {
          editor.chain().focus().setBlockquote().run()
        },
      },
      {
        name: "codeBlock",
        label: "Code Block",
        icon: <CodeBlockIcon className="w-4 h-4" />,
        description: "Code block with syntax highlighting",
        shouldBeHidden: (editor) => editor.isActive("columns"),
        action: (editor) => {
          editor.chain().focus().setCodeBlock().run()
        },
      },
    ],
  },
  {
    name: "insert",
    title: "Insert",
    commands: false
      ? [
          {
            name: "table",
            label: "Table",
            iconName: "Table",
            description: "Insert a table",
            shouldBeHidden: (editor) => editor.isActive("columns"),
            action: (editor) => {
              editor
                .chain()
                .focus()
                .insertTable({ rows: 3, cols: 3, withHeaderRow: false })
                .run()
            },
          },
          {
            name: "image",
            label: "Image",
            iconName: "Image",
            description: "Insert an image",
            aliases: ["img"],
            action: (editor) => {
              editor.chain().focus().setImageUpload().run()
            },
          },
          {
            name: "columns",
            label: "Columns",
            iconName: "Columns2",
            description: "Add two column content",
            aliases: ["cols"],
            shouldBeHidden: (editor) => editor.isActive("columns"),
            action: (editor) => {
              editor
                .chain()
                .focus()
                .setColumns()
                .focus(editor.state.selection.head - 1)
                .run()
            },
          },
          {
            name: "horizontalRule",
            label: "Horizontal Rule",
            iconName: "Minus",
            description: "Insert a horizontal divider",
            aliases: ["hr"],
            action: (editor) => {
              editor.chain().focus().setHorizontalRule().run()
            },
          },
          {
            name: "toc",
            label: "Table of Contents",
            iconName: "Book",
            aliases: ["outline"],
            description: "Insert a table of contents",
            shouldBeHidden: (editor) => editor.isActive("columns"),
            action: (editor) => {
              editor.chain().focus().insertTableOfContents().run()
            },
          },
        ]
      : [],
  },
]

export default GROUPS
