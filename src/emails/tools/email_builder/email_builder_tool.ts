// takes in a structured json, returns mjml template which further be converted to html for the email
import {
  EmailContentSchemaDto,
  EmailContentStyleSchemaDto,
  EmailSectionSchemaDto,
} from "@/content/dto/create_email_content_dto.ts"

import { cuid } from "@/shared/utils/cuid/cuid.ts"

export class EmailBuilderTool {
  private inlineStyles: {
    id: string
    styles: Record<string, string | number>
  }[] = []

  private fontFamilies: Required<
    EmailContentStyleSchemaDto["fontFamily"]
  >[] = []
  //
  constructor(private schema: EmailContentSchemaDto) {}

  build() {
    return this.root()
  }

  private resolveCssStyleValue(style: string, value: string) {
    if (style === "min-height") {
      return `${value}px`
    }

    return value
  }

  private getClassBasedCssStyles(
    id: string,
    styles: EmailContentSchemaDto["container"]["styles"],
    inlineStylesList = ["min-height"],
  ) {
    const definedClassBasedStyles = Object.keys(styles).filter((key) =>
      inlineStylesList.includes(key),
    )

    for (const key of definedClassBasedStyles) {
      this.inlineStyles.push({
        id,
        styles: {
          [key]: this.resolveCssStyleValue(
            key,
            (styles as Record<string, any>)[key],
          ),
        },
      })
    }
  }

  private getElementAttributes(
    styles: EmailContentStyleSchemaDto,
    type: EmailSectionSchemaDto["type"],
  ) {
    const attributes: Record<string, string> = {}

    if (
      styles.padding &&
      (styles.padding.top ||
        styles.padding.right ||
        styles.padding.bottom ||
        styles.padding.left)
    ) {
      attributes["padding"] =
        `${styles.padding.top}px ${styles.padding.right}px ${styles.padding.bottom}px ${styles.padding.left}px`
    }

    if (
      styles.margin &&
      (styles.margin.top ||
        styles.margin.right ||
        styles.margin.bottom ||
        styles.margin.left)
    ) {
      attributes["margin"] =
        `${styles.margin.top}px ${styles.margin.right}px ${styles.margin.bottom}px ${styles.margin.left}px`
    }

    if (styles.backgroundColor) {
      attributes["background-color"] = styles.backgroundColor
    }

    if (styles.width) {
      attributes["width"] = styles.width
    }

    const typesSupportingFontFamily = ["text", "button"]

    if (styles.fontFamily && typesSupportingFontFamily.includes(type)) {
      attributes["font-family"] =
        `${styles.fontFamily?.name}, ${this.schema.container.styles.fontFamily?.name}`
    }

    return Object.keys(attributes)
      .map((attribute) => `${attribute}="${attributes[attribute]}"`)
      .join(" ")
  }

  private getPadding(padding: EmailContentStyleSchemaDto["padding"]) {
    return `${padding?.top}px ${padding?.right}px ${padding?.bottom}px ${padding?.left}px`
  }

  private getFontFamilyStyles() {
    return `${this.fontFamilies
      .filter((fontFamily) => fontFamily !== undefined)
      .map(
        (font) =>
          `<mj-font name="${font?.name}" href="${font?.url}"></mj-font>`,
      )
      .join("\n")}`
  }

  private getInlineStyles() {
    return `${this.inlineStyles.map((style) => `.${style.id} { ${Object.keys(style.styles).map((styleKey) => `${styleKey}: ${style.styles[styleKey]}`)} }`)}`
  }

  private buildSections(
    elements: EmailContentSchemaDto["sections"],
  ): string {
    return elements
      .map((element) => {
        const id = cuid()

        this.getClassBasedCssStyles(id, element.styles)

        if (element.styles.fontFamily) {
          this.fontFamilies.push(element.styles.fontFamily)
        }

        switch (element.type) {
          case "grid":
            return /* html */ `<mj-section css-class="${id}" ${this.getElementAttributes(element.styles, element.type)}>
          ${this.buildSections(element.elements ?? [])}
          </mj-section>`
          case "grid-item":
            return /* html */ `<mj-column ${this.getElementAttributes(element.styles, element.type)}>${this.buildSections(element.elements ?? [])}</mj-column>`
          case "button":
            return /* html */ `<mj-button ${this.getElementAttributes(element.styles, element.type)}></mj-button>`
          default:
            return ""
        }
      })
      .join("\n")
  }

  private root() {
    if (this.schema.container.styles.fontFamily) {
      this.fontFamilies.push(this.schema.container.styles.fontFamily)
    }

    const sectionContent = this.buildSections(this.schema.sections)

    this.getClassBasedCssStyles("wrapper", this.schema.wrapper.styles)

    return /* html */ `
    <mjml>
      <mj-head>
         <mj-style>
            .body {
              padding: ${this.getPadding(this.schema.container.styles.padding)};
            }
            ${this.getInlineStyles()}
         </mj-style>
         ${this.getFontFamilyStyles()}
      </mj-head>
      <mj-body css-class="body" background-color="${this.schema.container.styles.backgroundColor}">
         <mj-wrapper css-class="wrapper" ${this.getElementAttributes(this.schema.wrapper.styles, "container")}>
            ${sectionContent}
         </mj-wrapper>
      </mj-body>
   </mjml>`
  }
}
