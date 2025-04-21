type GlobalStyle = {
  [key: string]: string | number
}

type WebFont = string

type GlobalConfig = {
  style: GlobalStyle
  largeStyle?: GlobalStyle
  webFonts?: WebFont[]
}

type ElementType =
  | 'row'
  | 'column'
  | 'image'
  | 'heading'
  | 'button'
  | 'spacer'
  | 'paragraph'
  | 'text'
  | 'menu'
  | 'menu-item'

type ElementProperties = {
  [key: string]: string | number | boolean
}

type Element = {
  name?: string
  type: ElementType
  properties?: ElementProperties
  largeProperties?: ElementProperties
  style?: GlobalStyle
  elements?: Element[]
  value?: string
}

type Section = {
  name?: string
  type: ElementType
  properties?: ElementProperties
  elements?: Element[]
}

export type EmailTemplateSchema = {
  global: GlobalConfig
  sections: Section[]
}

/**
 * FoundationEmailBuilderTool generates responsive HTML emails from a declarative schema.
 *
 * This tool is a critical component of Kibamail's email creation system, providing a
 * structured way to generate responsive HTML emails that work across different email clients.
 * It implements a component-based approach based on the Foundation for Emails framework,
 * which ensures compatibility with major email clients.
 *
 * Key features include:
 * 1. Declarative schema-based email definition
 * 2. Responsive design with mobile-first approach
 * 3. Component-based architecture for reusability
 * 4. Inline CSS generation for maximum compatibility
 * 5. Web font integration for brand consistency
 *
 * The tool transforms a structured schema definition into properly formatted HTML email
 * markup with inline styles, ensuring consistent rendering across email clients while
 * maintaining a clean separation between structure and presentation in the codebase.
 */
export class FoundationEmailBuilderTool {
  private schema: EmailTemplateSchema

  /**
   * Creates a new email builder with the specified template schema.
   *
   * @param schema - The email template schema defining structure and styles
   */
  constructor(schema: EmailTemplateSchema) {
    this.schema = schema
  }

  /**
   * Builds the complete email template from the schema.
   *
   * This method orchestrates the entire email generation process:
   * 1. Generates global CSS styles for the email
   * 2. Prepares web font imports if specified
   * 3. Converts each section of the email to HTML
   * 4. Wraps sections in a container for proper layout
   *
   * The resulting components can be combined with a Foundation for Emails
   * template to create the final HTML email that's ready for sending.
   *
   * @returns Object containing global styles, web fonts, and email sections
   */
  public build(): {
    globalStyles: string
    webFonts: string
    sections: string
  } {
    const globalStyles = this.generateGlobalStyles()
    const webFonts = this.generateWebFonts()
    const sections = this.schema.sections
      .map((section) => this.convertSection(section))
      .join('\n\n')

    return {
      globalStyles,
      webFonts,
      sections: `<container>${sections}</container>`,
    }
  }

  private generateGlobalStyles(): string {
    const { style, largeStyle } = this.schema.global
    let styles = this.styleObjectToCss(style)

    if (largeStyle) {
      styles += '@media only screen and (min-width: 600px) {\n'
      styles += this.styleObjectToCss(largeStyle, '  ')
      styles += '}\n'
    }

    return styles
  }

  private generateWebFonts(): string {
    const { webFonts } = this.schema.global
    if (!webFonts || webFonts.length === 0) return ''

    return webFonts.map((font) => `<link rel="stylesheet" href="${font}">`).join('\n')
  }

  private styleObjectToCss(style: GlobalStyle, indent = ''): string {
    let css = ''

    for (let [key, value] of Object.entries(style)) {
      if (key === 'font-family') {
        value = `${value ? `${value}, ` : ''}${this.schema.global.style['font-family']}`
      }
      css += `${indent}${key}: ${value};\n`
    }
    return css
  }

  private convertSection(section: Section): string {
    return this.convertElement(section)
  }

  private convertElement(element: Element): string {
    const convertedElement = this.getConvertedElement(element)
    return this.applyInlineStyles(convertedElement, element)
  }

  private getConvertedElement(element: Element): string {
    switch (element.type) {
      case 'row':
        return this.convertRow(element)
      case 'column':
        return this.convertColumn(element)
      case 'image':
        return this.convertImage(element)
      case 'heading':
        return this.convertHeading(element)
      case 'button':
        return this.convertButton(element)
      case 'spacer':
        return this.convertSpacer(element)
      case 'paragraph':
        return this.convertParagraph(element)
      case 'text':
        return this.convertText(element)
      case 'menu':
        return this.convertMenu(element)
      case 'menu-item':
        return this.convertMenuItem(element)
      default:
        return ''
    }
  }

  private applyInlineStyles(element: string, elementData: Element): string {
    const { style } = elementData
    if (!style) return element

    style['font-family'] = `${
      style?.['font-family'] ? `${style?.['font-family']}, ` : ''
    }${this.schema.global.style['font-family']}`

    const styleString = Object.entries(style)
      .map(([key, value]) => `${key}:${value}`)
      .join(';')

    const firstSpaceIndex = element.indexOf(' ')
    const firstCloseTagIndex = element.indexOf('>')

    if (firstSpaceIndex === -1 || firstSpaceIndex > firstCloseTagIndex) {
      // No attributes, insert style right before closing bracket
      return element.replace('>', ` style="${styleString}">`)
    }
    // There are other attributes, append style
    return element.replace(' ', ` style="${styleString}" `)
  }

  /**
   * Converts a row element to Foundation for Emails HTML.
   *
   * Rows are horizontal containers that organize content into sections.
   * They can contain multiple columns and provide the basic structure for
   * the email layout. The 'collapsed' property removes column gutters for
   * a tighter layout when needed.
   *
   * @param element - The row element to convert
   * @returns HTML markup for the row
   */
  private convertRow(element: Element): string {
    const className = element.properties?.collapsed ? ' class="collapsed"' : ''
    const children =
      element.elements?.map((child) => this.convertElement(child)).join('\n') || ''
    return `<row${className}>\n${children}\n</row>`
  }

  /**
   * Converts a column element to Foundation for Emails HTML.
   *
   * Columns divide rows into responsive vertical sections. They support
   * different widths for small (mobile) and large (desktop) screens,
   * enabling responsive layouts. The width is specified on a 12-column grid,
   * where 12 represents full width.
   *
   * @param element - The column element to convert
   * @returns HTML markup for the column
   */
  private convertColumn(element: Element): string {
    const large = element.largeProperties?.width
      ? ` large="${element.largeProperties.width}"`
      : ''
    const small = element.properties?.width ? ` small="${element.properties.width}"` : ''
    const children =
      element.elements?.map((child) => this.convertElement(child)).join('\n') || ''
    return `<columns${small}${large}>\n${children}\n</columns>`
  }

  private convertImage(element: Element): string {
    const src = element.properties?.src || ''
    const alt = element.properties?.alt ? ` alt="${element.properties.alt}"` : ''
    const align = element.properties?.align === 'center' ? '<center>\n  ' : ''
    const alignEnd = element.properties?.align === 'center' ? '\n</center>' : ''
    return `${align}<img src="${src}"${alt}>${alignEnd}`
  }

  private convertHeading(element: Element): string {
    const size = element.properties?.size || 1
    const align = element.properties?.align
      ? ` class="text-${element.properties.align}"`
      : ''
    const content =
      element.elements?.map((child) => this.convertElement(child)).join('') || ''
    return `<h${size}${align}>${content}</h${size}>`
  }

  /**
   * Converts a button element to Foundation for Emails HTML.
   *
   * Buttons are styled call-to-action elements that stand out in emails.
   * They're designed to be touch-friendly on mobile devices and maintain
   * consistent appearance across email clients. The 'expand' class makes
   * the button full-width on small screens for better touch targets.
   *
   * This implementation ensures buttons render properly even in email clients
   * that strip out CSS, by using Foundation's battle-tested button component.
   *
   * @param element - The button element to convert
   * @returns HTML markup for the button
   */
  private convertButton(element: Element): string {
    const href = element.properties?.href ? ` href="${element.properties.href}"` : ''
    const className =
      element.properties?.width === 12 ? ' class="large expand"' : ' class="large"'
    const content =
      element.elements?.map((child) => this.convertElement(child)).join('') || 'Click me'
    return `<button${className}${href}>${content}</button>`
  }

  private convertSpacer(element: Element): string {
    const size = element.properties?.height || 16
    return `<spacer size="${size}"></spacer>`
  }

  private convertParagraph(element: Element): string {
    const align = element.properties?.align
      ? ` class="text-${element.properties.align}"`
      : ''
    const content =
      element.elements?.map((child) => this.convertElement(child)).join('') || ''
    return `<p${align}>${content}</p>`
  }

  private convertText(element: Element): string {
    // Wrap the text in a span to allow for inline styling
    return `<span>${element.value || ''}</span>`
  }

  private convertMenu(element: Element): string {
    const align = element.properties?.align === 'center' ? '<center>\n  ' : ''
    const alignEnd = element.properties?.align === 'center' ? '\n</center>' : ''
    const items =
      element.elements?.map((child) => this.convertElement(child)).join('\n') || ''
    return `${align}<menu>\n${items}\n</menu>${alignEnd}`
  }

  private convertMenuItem(element: Element): string {
    const content =
      element.elements?.map((child) => this.convertElement(child)).join('') || ''
    return `  <item>${content}</item>`
  }
}
