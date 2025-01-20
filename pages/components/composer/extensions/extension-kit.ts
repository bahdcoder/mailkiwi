"use client"

import { ImageUpload } from "./ImageUpload/ImageUpload.js"
import { TableOfContentsNode } from "./TableOfContentsNode/TableOfContentsNode.jsx"
import {
  BlockquoteFigure,
  CharacterCount,
  CodeBlock,
  Color,
  Column,
  Columns,
  Details,
  DetailsContent,
  DetailsSummary,
  Document,
  Dropcursor,
  Emoji,
  Figcaption,
  FileHandler,
  Focus,
  FontFamily,
  FontSize,
  Heading,
  Highlight,
  HorizontalRule,
  ImageBlock,
  Link,
  Placeholder,
  Selection,
  SlashCommand,
  StarterKit,
  Subscript,
  Superscript,
  Table,
  TableCell,
  TableHeader,
  TableOfContents,
  TableRow,
  TaskItem,
  TaskList,
  TextAlign,
  TextStyle,
  TrailingNode,
  Typography,
  Underline,
  UniqueID,
  emojiSuggestion,
} from "./index.js"

interface ExtensionKitProps {}

export const ExtensionKit = () => [
  Document,
  Columns,
  Column,
  // Selection,
  Heading.configure({
    levels: [1, 2, 3, 4],
  }),
  HorizontalRule,
  // UniqueID.configure({
  //   types: ["paragraph", "heading", "blockquote", "codeBlock", "table"],
  //   // filterTransaction: (transaction) => !isChangeOrigin(transaction),
  // }),
  StarterKit.configure({
    document: false,
    dropcursor: false,
    heading: false,
    horizontalRule: false,
    blockquote: false,
    history: false,
    codeBlock: false,
  }),
  // Details.configure({
  //   persist: true,
  //   HTMLAttributes: {
  //     class: "details",
  //   },
  // }),
  // DetailsContent,
  // DetailsSummary,
  // CodeBlock,
  TextStyle,
  FontSize,
  FontFamily,
  Color,
  // TrailingNode,
  Link.configure({
    openOnClick: false,
  }),
  // Highlight.configure({ multicolor: true }),
  Underline,
  // CharacterCount.configure({ limit: 50000 }),
  // TableOfContents,
  // TableOfContentsNode,
  // ImageUpload.configure(),
  // ImageBlock,
  // FileHandler.configure({
  //   allowedMimeTypes: ["image/png", "image/jpeg", "image/gif", "image/webp"],
  //   onDrop: (currentEditor, files, pos) => {
  //     console.log({ files })
  //     // files.forEach(async (file) => {
  //     //   const url = await API.uploadImage(file)

  //     //   currentEditor.chain().setImageBlockAt({ pos, src: url }).focus().run()
  //     // })
  //   },
  //   onPaste: (currentEditor, files) => {
  //     // files.forEach(async (file) => {
  //     //   const url = await API.uploadImage(file)

  //     //   return currentEditor
  //     //     .chain()
  //     //     .setImageBlockAt({ pos: currentEditor.state.selection.anchor, src: url })
  //     //     .focus()
  //     //     .run()
  //     // })
  //     console.log({ files })
  //   },
  // }),
  Emoji.configure({
    enableEmoticons: true,
    suggestion: emojiSuggestion,
  }),
  TextAlign.extend({
    addKeyboardShortcuts() {
      return {}
    },
  }).configure({
    types: ["heading", "paragraph"],
  }),
  // Subscript,
  // Superscript,
  // Table,
  // TableCell,
  // TableHeader,
  // TableRow,
  Typography,
  // Placeholder.configure({
  //   includeChildren: true,
  //   showOnlyCurrent: false,
  //   placeholder: () => "",
  // }),
  SlashCommand,
  // Focus,
  // Figcaption,
  // BlockquoteFigure,
  // Dropcursor.configure({
  //   width: 2,
  //   class: "ProseMirror-dropcursor border-black",
  // }),
]
