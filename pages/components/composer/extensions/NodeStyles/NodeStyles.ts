import { type CommandProps, Editor, Extension } from '@tiptap/core'

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    nodeStyles: {
      setNodeStyle: (property: string, value: string) => ReturnType
      removeNodeStyle: (property: string) => ReturnType
    }
  }
}

// Convert object styles to CSS string for HTML rendering
const stylesToString = (styles: Record<string, string>) => {
  return Object.entries(styles)
    .map(([property, value]) => `${property}: ${value}`)
    .join('; ')
}

export function getStyleAttributeDefinition(
  defaultAttributes?: Record<string, string | number | boolean>,
) {
  return {
    default: defaultAttributes ?? {},
    parseHTML(element: HTMLElement) {
      const styleString = element.getAttribute('style')
      return styleString ? parseStyleString(styleString) : {}
    },
    renderHTML(attributes: Record<string, unknown>) {
      if (!attributes.styles || Object.keys(attributes.styles).length === 0) {
        return {}
      }
      return {
        style: stylesToString(attributes.styles as Record<string, string>),
      }
    },
  }
}

export function getStyleAttributeDefaultCommands() {
  return {
    setNodeStyle:
      (property: string, value: string) =>
      ({ chain, state }: CommandProps) => {
        const { selection } = state
        const { $from } = selection

        const node = $from.node()
        const currentStyles = node.attrs.styles || {}

        return chain()
          .updateAttributes(node.type.name, {
            styles: {
              ...currentStyles,
              [property]: value,
            },
          })
          .run()
      },

    removeNodeStyle:
      (property: string) =>
      ({ chain, state }: CommandProps) => {
        const { selection } = state
        const { $from } = selection
        const node = $from.node()

        if (!node.attrs.styles) return false

        const newStyles = { ...node.attrs.styles }
        delete newStyles[property]

        return chain()
          .updateAttributes(node.type.name, {
            styles: newStyles,
          })
          .run()
      },
  }
}

// Parse CSS string to object when reading from HTML
const parseStyleString = (styleString: string) => {
  if (!styleString) return {}
  return styleString
    .split(';')
    .filter((style) => style.trim())
    .reduce(
      (acc, style) => {
        const [property, value] = style.split(':').map((str) => str.trim())
        acc[property] = value
        return acc
      },
      {} as Record<string, string>,
    )
}

export const NodeStyles = Extension.create({
  name: 'nodeStyles',

  addGlobalAttributes() {
    return [
      {
        types: [
          'paragraph',
          'heading',
          'blockquote',
          'bulletList',
          'orderedList',
          'listItem',
          'code',
          'container',
        ],
        attributes: {
          styles: {
            default: {},
            parseHTML: (element) => {
              const styleString = element.getAttribute('style')
              return styleString ? parseStyleString(styleString) : {}
            },
            renderHTML: (attributes) => {
              if (!attributes.styles || Object.keys(attributes.styles).length === 0) {
                return {}
              }
              return { style: stylesToString(attributes.styles) }
            },
          },
        },
      },
    ]
  },

  addCommands() {
    return {
      setNodeStyle:
        (property: string, value: string) =>
        ({ chain, state }) => {
          const { selection } = state
          const { $from } = selection

          const node = $from.node()
          const currentStyles = node.attrs.styles || {}

          return chain()
            .updateAttributes(node.type.name, {
              styles: {
                ...currentStyles,
                [property]: value,
              },
            })
            .run()
        },

      removeNodeStyle:
        (property: string) =>
        ({ chain, state }) => {
          const { selection } = state
          const { $from } = selection
          const node = $from.node()

          if (!node.attrs.styles) return false

          const newStyles = { ...node.attrs.styles }
          delete newStyles[property]

          return chain()
            .updateAttributes(node.type.name, {
              styles: Object.keys(newStyles).length > 0 ? newStyles : null,
            })
            .run()
        },
    }
  },
})
