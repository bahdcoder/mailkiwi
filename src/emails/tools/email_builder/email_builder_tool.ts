// takes in a structured json, returns mjml template which further be converted to html for the email
import {
  EmailContentCorneredStyle,
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

  private fontFamilies: EmailContentStyleSchemaDto["fontFamily"][] = []
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

  private getElementProperties(
    element: EmailContentSchemaDto["sections"][number],
  ) {
    const properties: Record<string, string> = {}
    if (element.type === "button") {
      properties["href"] = element.properties?.href?.url ?? "#"
    }

    return Object.keys(properties)
      .map((attribute) => `${attribute}="${properties[attribute]}"`)
      .join(" ")
  }

  private getElementAttributes(
    element: EmailContentSchemaDto["sections"][number],
  ) {
    const { styles = {}, type } = element
    const attributes: Record<string, string> = {}

    attributes["padding"] = this.getPadding(styles?.padding)

    const typesSupportingMargin = [""]

    if (element.type === "button") {
      attributes["href"] = element.properties?.href?.url ?? "#"
    }

    if (typesSupportingMargin.includes(type)) {
      attributes["margin"] =
        `${styles?.margin?.top ?? 0}px ${styles?.margin?.right ?? 0}px ${styles?.margin?.bottom ?? 0}px ${styles?.margin?.left ?? 0}px`
    }

    if (styles.backgroundColor) {
      attributes["background-color"] = styles.backgroundColor
    }

    const typesSupportingVerticalAlign = ["grid-item"]

    const typesSupportingHorizontalAlign = ["image", "button"]

    if (typesSupportingHorizontalAlign.includes(type)) {
      attributes["align"] = styles.horizontalAlign ?? "left"
    }

    if (typesSupportingVerticalAlign.includes(type)) {
      attributes["vertical-align"] = styles.verticalAlign ?? "middle"
    }

    if (styles.width) {
      attributes["width"] = styles.width
    }

    const typesSupportingFontFamily = ["text", "button"]

    if (styles.fontFamily && typesSupportingFontFamily.includes(type)) {
      attributes["font-family"] =
        `${styles.fontFamily?.name}, ${this.schema.container.styles.fontFamily?.name}`
    }

    if (styles.color) {
      attributes["color"] = styles.color
    }

    return Object.keys(attributes)
      .map((attribute) => `${attribute}="${attributes[attribute]}"`)
      .join(" ")
  }

  private getPadding(padding: EmailContentStyleSchemaDto["padding"]) {
    return `${padding?.top ?? 0}px ${padding?.right ?? 0}px ${padding?.bottom ?? 0}px ${padding?.left ?? 0}px`
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

  private buildSections() {
    return this.schema.sections.map(
      (section) =>
        `<mj-wrapper ${this.getElementAttributes(section)}>${this.buildElement(section)}</mj-wrapper>`,
    )
  }

  private getRawHTMLElementStyles(
    element: EmailContentSchemaDto["sections"][number],
  ) {
    return `style="${this.getRawCssStyles(element).join(";")}"`
  }

  private getRawCssStyles(
    element: EmailContentSchemaDto["sections"][number],
  ) {
    if (!element.styles) {
      return []
    }

    let styleAttributes: string[] = []

    for (const styleKey in element.styles) {
      const key = styleKey as keyof typeof element.styles
      const style = element.styles[key]

      switch (key) {
        case "backgroundColor":
          styleAttributes.push(`background-color: ${style}`)
          break
        case "color":
          styleAttributes.push(`color: ${style}`)
        case "borderRadius":
          const values = style as EmailContentCorneredStyle

          if (values.top || values.bottom || values.left || values.right) {
            styleAttributes.push(
              `border-radius: ${values?.top ?? 0}px;${values?.right ?? 0}px;${values?.bottom ?? 0}px;${values?.left ?? 0}px;`,
            )
          }
        case "textDecoration":
          styleAttributes.push(`text-decoration: ${style}`)

        default:
          break
      }
    }

    return styleAttributes
  }

  private addFontFamily(
    fontFamily: EmailContentStyleSchemaDto["fontFamily"],
  ) {
    const familyExists = this.fontFamilies.find(
      (font) => font?.name === fontFamily?.name,
    )

    if (!familyExists) {
      this.fontFamilies.push(fontFamily)
    }
  }

  private buildElement(
    element: EmailContentSchemaDto["sections"][number],
    nestedInGrid = false,
  ): string {
    if (!element.elements || element.elements.length === 0) {
      return ""
    }

    // are all elements text ? if yes, we are building text.
    const isTextCombination = element.elements.every(
      (element) => element.type === "text",
    )

    if (isTextCombination) {
      // handle button text
      const textChunks = element.elements.map(
        (text) =>
          `<span ${this.getRawHTMLElementStyles(text)}>${text.value}</span>`,
      )

      return element.type === "button"
        ? textChunks.join("")
        : `<mj-text padding="0">${textChunks.join("\n")}</mj-text>`
    }

    return element.elements
      .map((element) => {
        const id = cuid()

        this.getClassBasedCssStyles(id, element.styles)

        if (element.styles.fontFamily) {
          this.addFontFamily(element.styles.fontFamily)
        }

        if (element.type === "grid" && nestedInGrid) {
          return `<mj-table><tr>${this.buildElement(element, true)}</tr></mj-table>`
        }

        if (element.type === "grid-item" && nestedInGrid) {
          return `<td>${this.buildElement(element, true)}</td>`
        }

        switch (element.type) {
          // case "section":
          //   return /* html */ `<mj-wrapper css-class="${id}" ${this.getElementAttributes(element)}>${this.buildElement(element, true)}</mj-wrapper>`
          case "grid":
            return /* html */ `<mj-section ${this.getElementAttributes(element)}>
              ${this.buildElement(element)}
            </mj-section>`
          case "grid-item":
            return /* html */ `<mj-column ${this.getElementAttributes(element)}>${this.buildElement(element, true)}</mj-column>`
          case "button":
            if (nestedInGrid) {
              return `<a ${this.getElementProperties(element)} ${this.getRawHTMLElementStyles(element)}>${this.buildElement(element, true)}</a>`
            }

            return /* html */ `<mj-button ${this.getElementAttributes(element)}>${this.buildElement(element)}</mj-button>`
          case "image":
            return /* html */ `<mj-image ${this.getElementAttributes(element)} src="${element.value}" />`
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

    const sectionContent = this.buildSections()

    this.getClassBasedCssStyles("wrapper", this.schema.wrapper.styles)

    //  <mj-wrapper css-class="wrapper" ${this.getElementAttributes({ type: "container", ...this.schema.wrapper })}>
    //  </mj-wrapper>

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
         <mj-style inline="inline">
            @media only screen and (max-width: 600px) {}
            @media only screen and (min-width:480px) {
              .show-on-desktop {
                display: block !important;
              }
            }
            @media only screen and (max-width:479px) {
              .hide-on-mobile {
                display: none !important;
              }
            }
         </mj-style>
      </mj-head>
      <mj-body background-color="${this.schema.container.styles.backgroundColor}">
         ${sectionContent}
      </mj-body>
   </mjml>`
  }
}
