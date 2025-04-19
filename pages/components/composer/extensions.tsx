import { Slash, createSuggestionsItems } from '@harshtalks/slash-tiptap'

export const suggestions = createSuggestionsItems([
  {
    title: 'text',
    searchTerms: ['paragraph'],
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleNode('paragraph', 'paragraph').run()
    },
  },
  {
    title: 'Bullet List',
    searchTerms: ['unordered', 'point'],
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleBulletList().run()
    },
  },
  {
    title: 'Ordered List',
    searchTerms: ['ordered', 'point', 'numbers'],
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleOrderedList().run()
    },
  },
])

export const editorExtensions = [
  Slash.configure({
    suggestion: {
      items() {
        return suggestions
      },
    },
  }),
]
