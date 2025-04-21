import {
  Body,
  Container,
  Font,
  Head,
  Heading,
  type HeadingAs,
  Html,
  Img,
  Section,
  Text,
  render,
} from '@react-email/components'
import React from 'react'

export interface ProsemirrorContent {
  type: string
  content?: ProsemirrorContent[]
  attrs?: Record<string, unknown>
  text?: string
  marks?: Array<{ type: string }>
}

export type MetaDescriptor =
  | {
      charSet: 'utf-8'
    }
  | {
      title: string
    }
  | {
      name: string
      content: string
    }
  | {
      property: string
      content: string
    }
  | {
      httpEquiv: string
      content: string
    }
  | {
      tagName: 'meta' | 'link'
      [attribute: string]: string
    }
  | {
      [name: string]: string
    }

export type MetaDescriptors = MetaDescriptor[]

export class ReactEmailBuilderTool {
  protected marksOrder = ['underline', 'bold', 'italic', 'strike', 'link']

  protected DEFAULT_META_TAGS: MetaDescriptors = [
    {
      name: 'viewport',
      content: 'width=device-width',
    },
    {
      httpEquiv: 'X-UA-Compatible',
      content: 'IE=edge',
    },
    {
      name: 'x-apple-disable-message-reformatting',
    },
    {
      name: 'format-detection',
      content: 'telephone=no,address=no,email=no,date=no,url=no',
    },
    {
      name: 'color-scheme',
      content: 'light',
    },
    {
      name: 'supported-color-schemes',
      content: 'light',
    },
  ]

  private meta(meta: MetaDescriptors) {
    function process(props: MetaDescriptor) {
      if ('tagName' in props) {
        const { tagName, ...attributes } = props
        const Comp = tagName
        return <Comp key={JSON.stringify(attributes)} {...attributes} />
      }

      if ('title' in props) {
        return <title>{props.title}</title>
      }

      if ('charSet' in props) {
        return <meta charSet={props.charSet} />
      }

      return <meta key={JSON.stringify(props)} {...props} />
    }

    function has(meta: MetaDescriptor) {
      const sortedMeta = Object.keys(meta)
        .sort()
        .reduce((acc, key) => {
          const _key = key as keyof MetaDescriptor
          acc[_key] = meta[_key]
          return acc
        }, {} as MetaDescriptor)

      return JSON.stringify(sortedMeta)
    }

    return meta
      .filter((meta, index, self) => {
        const meta_hash = has(meta)
        return (
          index ===
          self.findIndex((t) => {
            return has(t) === meta_hash
          })
        )
      })
      .map(process)
      .filter(Boolean) as JSX.Element[]
  }

  private text(node: ProsemirrorContent): JSX.Element | null {
    const text = node.text || <>&nbsp;</>

    if (node.marks) {
      return this.marks(node)
    }

    return <>{text}</>
  }

  private imageBlock(node: ProsemirrorContent) {
    const attrs = node.attrs as {
      src: string
      alt: string
      width: string
      align: React.CSSProperties['textAlign']
    }

    return (
      <Img
        src={attrs.src}
        alt={attrs.alt}
        style={{ width: attrs.width, textAlign: attrs.align }}
      />
    )
  }

  private marks(node: ProsemirrorContent) {
    const text = node?.text || <>&nbsp;</>
    const marks = node?.marks || []

    marks.sort((a, b) => {
      return this.marksOrder.indexOf(a.type) - this.marksOrder.indexOf(b.type)
    })

    return marks.reduce(
      (jsx, mark) => {
        switch (mark.type) {
          case 'italic':
            return <i>{jsx}</i>
          case 'bold':
            return <b>{jsx}</b>
          case 'underline':
            return <u>{jsx}</u>
          case 'strike':
            return <s style={{ textDecoration: 'line-through' }}>{jsx}</s>
          default:
            return null
        }
      },
      text as JSX.Element | null,
    )
  }

  private styles(styles: Record<string, string>): React.CSSProperties {
    return {
      color: styles?.color,
      fontSize: styles?.['font-size'],
      lineHeight: styles?.['line-height'],
      padding: styles?.padding,
      wordBreak: styles?.['word-break'] as React.CSSProperties['wordBreak'],
      fontWeight: styles?.['font-weight'],
      letterSpacing: styles?.['letter-spacing'],
    }
  }

  private heading(node: ProsemirrorContent) {
    const attrs = node.attrs as {
      styles: Record<string, string>
      level: 1 | 2 | 3 | 4 | 5 | 6
    }

    const headingLevel = `h${attrs.level}` as HeadingAs['as']

    return (
      <Heading style={this.styles(attrs.styles)} as={headingLevel}>
        {node.content?.map((childNode) => (
          <React.Fragment key={node.type}>{this.node(childNode)}</React.Fragment>
        ))}
      </Heading>
    )
  }

  private paragraph(node: ProsemirrorContent) {
    const attrs = node.attrs as { styles: Record<string, string> }

    return (
      <Text style={this.styles(attrs.styles)}>
        {node.content?.map((childNode) => (
          <React.Fragment key={node.type}>{this.node(childNode)}</React.Fragment>
        ))}
      </Text>
    )
  }

  private listItem(node: ProsemirrorContent) {
    const attrs = node.attrs as { styles: Record<string, string> }

    return (
      <li style={this.styles(attrs.styles)}>
        {node.content?.map((childNode) => (
          <React.Fragment key={node.type}>{this.node(childNode)}</React.Fragment>
        ))}
      </li>
    )
  }

  private bulletList(node: ProsemirrorContent) {
    const attrs = node.attrs as { styles: Record<string, string> }

    return (
      <ul style={this.styles(attrs.styles)}>
        {node.content?.map((childNode) => (
          <React.Fragment key={node.type}>{this.node(childNode)}</React.Fragment>
        ))}
      </ul>
    )
  }

  private orderedList(node: ProsemirrorContent) {
    const attrs = node.attrs as { styles: Record<string, string> }

    return (
      <ol style={this.styles(attrs.styles)}>
        {node.content?.map((childNode) => (
          <React.Fragment key={node.type}>{this.node(childNode)}</React.Fragment>
        ))}
      </ol>
    )
  }

  private node(node: ProsemirrorContent): JSX.Element | null {
    switch (node.type) {
      case 'imageBlock':
        return this.imageBlock(node)
      case 'paragraph':
        return this.paragraph(node)
      case 'text':
        return this.text(node)
      case 'heading':
        return this.heading(node)
      case 'orderedList':
        return this.orderedList(node)
      case 'bulletList':
        return this.bulletList(node)
      case 'listItem':
        return this.listItem(node)
      default:
        return null
    }
  }

  build(doc: ProsemirrorContent) {
    return render(
      <Html>
        <Head>
          <Font
            fallbackFontFamily="sans-serif"
            fontFamily="Inter"
            fontStyle="normal"
            fontWeight={400}
            webFont={{
              url: 'https://rsms.me/inter/font-files/Inter-Regular.woff2?v=3.19',
              format: 'woff2',
            }}
          />
          {/* This style is required for proper email rendering */}
          <style>
            {'blockquote,h1,h2,h3,img,li,ol,p,ul{margin-top:0;margin-bottom:0}'}
          </style>
          {this.meta(this.DEFAULT_META_TAGS)}
        </Head>
        <Body>
          <Container style={{}}>
            <Section>
              {doc.content?.map((node) => (
                <React.Fragment key={node.type}>{this.node(node)}</React.Fragment>
              ))}
            </Section>
          </Container>
        </Body>
      </Html>,
    )
  }
}
