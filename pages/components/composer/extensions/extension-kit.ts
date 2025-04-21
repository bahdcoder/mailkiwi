import { BulletList as BaseBulletList } from '@tiptap/extension-bullet-list'
import Code from '@tiptap/extension-code'
import History from '@tiptap/extension-history'
import { OrderedList as BaseNumberedList } from '@tiptap/extension-ordered-list'
import { ImageUpload } from './ImageUpload/ImageUpload.js'
import {
  BullettedList,
  Color,
  Column,
  Columns,
  Document,
  Dropcursor,
  Emoji,
  Figcaption,
  Focus,
  FontFamily,
  FontSize,
  Heading,
  HorizontalRule,
  ImageBlock,
  Link,
  NumberedList,
  Paragraph,
  Placeholder,
  Selection,
  SlashCommand,
  StarterKit,
  TextAlign,
  TextStyle,
  Typography,
  Underline,
  emojiSuggestion,
} from './index.js'

type ExtensionKitProps = { options?: { [key: string]: unknown } }

export const ExtensionKit = () => [
  Document,
  Columns,
  Column,
  Selection,
  History,
  BaseNumberedList,
  BaseBulletList,
  Heading.configure({
    levels: [1, 2, 3, 4],
  }),
  Paragraph,
  HorizontalRule,
  BullettedList,
  NumberedList,
  StarterKit.configure({
    document: false,
    dropcursor: false,
    heading: false,
    horizontalRule: false,
    blockquote: false,
    history: false,
    codeBlock: false,
    code: false,
    paragraph: false,
    bulletList: false,
    orderedList: false,
  }),

  TextStyle,
  FontSize,
  FontFamily,
  Color,
  Code,
  Link.configure({
    openOnClick: false,
  }),
  Underline,
  ImageUpload.configure(),

  ImageBlock,
  Emoji.configure({
    enableEmoticons: true,
    suggestion: emojiSuggestion,
  }),
  TextAlign.extend({
    addKeyboardShortcuts() {
      return {}
    },
  }).configure({
    types: ['heading', 'paragraph'],
  }),
  Typography,
  Placeholder.configure({
    includeChildren: false,
    showOnlyCurrent: true,
    placeholder: () => 'Type / to browse commands',
  }),
  SlashCommand,
  Focus,
  Figcaption,
  // BlockquoteFigure,
  Dropcursor.configure({
    width: 2,
    class: 'ProseMirror-dropcursor',
  }),
]
