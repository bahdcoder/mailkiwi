import { NodeViewContent, NodeViewProps, NodeViewWrapper } from "@tiptap/react"
import cn from "classnames"

export type ButtonNodeViewProps = NodeViewProps

export function ButtonNodeView(props: ButtonNodeViewProps) {
  const { textAlign, ...styles } = convertToReactStyles(props.node.attrs.styles)

  return (
    <NodeViewWrapper className="w-full flex flex-col">
      <NodeViewContent
        style={styles}
        className={cn("text-center transition-all ease-in-out duration-200", {
          "self-start": textAlign === "left",
          "self-center": textAlign === "center",
          "self-end": textAlign === "right",
        })}
      />
    </NodeViewWrapper>
  )
}

function convertToReactStyles(cssStyles: Record<string, string>) {
  const reactStyles: Record<string, string> = {}

  for (const [key, value] of Object.entries(cssStyles)) {
    // Convert CSS property names to camelCase
    const reactKey = key.replace(/-([a-z])/g, (match, letter) => letter.toUpperCase())

    // Assign the value to the new key
    reactStyles[reactKey] = value
  }

  return reactStyles
}
