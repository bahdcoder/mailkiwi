import { EmailContentSchemaDto } from "@/content/dto/create_email_content_dto.ts"

interface MJMLAttributes {
  [key: string]: string
}

interface MJMLClassStyles {
  [className: string]: Record<string, string>
}

interface MJMLNode {
  tag?: string
  classes?: MJMLClassStyles
  attributes?: MJMLAttributes
  children?: MJMLNode[]
}

class MJMLRenderer {
  public render(nodes: MJMLNode[]): string {
    return nodes.map(this.renderNode.bind(this)).join("")
  }

  private renderNode(node: MJMLNode): string {
    if (typeof node === "string") {
      return node
    }

    if (node.tag === "mj-style" && node.classes) {
      return this.renderMJStyle(node)
    }

    const { tag, attributes, children } = node

    if (!tag) {
      return ""
    }

    const attrs = this.renderAttributes(attributes)
    const childrenContent = children ? this.render(children) : ""

    return `<${tag}${attrs}>${childrenContent}</${tag}>`
  }

  private renderMJStyle(node: MJMLNode): string {
    const { classes } = node
    let styleContent = ""

    if (classes) {
      for (const className in classes) {
        const styles = classes[className]
        const styleString = this.renderStyles(styles)
        styleContent += `.${className} {\n  ${styleString}\n}\n`
      }
    }

    return `<mj-style>\n${styleContent}</mj-style>`
  }

  private renderAttributes(attributes?: MJMLAttributes): string {
    if (!attributes) return ""

    return Object.entries(attributes)
      .map(([key, value]) => ` ${key}="${value}"`)
      .join("")
  }

  private renderStyles(styles: Record<string, string>): string {
    return Object.entries(styles)
      .map(([property, value]) => `${property}: ${value};`)
      .join("\n  ")
  }
}
export class MJMLTemplateBuilder {
  constructor(private schema: EmailContentSchemaDto) {}

  private template(): MJMLNode[] {
    return [
      {
        tag: "mjml",
        children: [
          {
            tag: "mj-head",
            children: [
              {
                tag: "mj-style",
                classes: {
                  "section-wrapper": {
                    "min-height": "750px",
                  },
                  body: {
                    "padding-top": "48px",
                  },
                },
              },
            ],
          },
          {
            tag: "mj-body",
            attributes: {
              "background-color":
                this.schema.container.styles.backgroundColor,
              "css-class": "body",
            },
            children: [
              {
                tag: "mj-wrapper",
                attributes: {
                  "css-class": "section-wrapper",
                  "background-color": "#F7FAF3",
                },
                children: [],
              },
            ],
          },
        ],
      },
    ]
  }

  generate() {
    return new MJMLRenderer().render(this.template())
  }
}
