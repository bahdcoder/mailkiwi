import type {
  HTMLJsonBlock,
  UpdateWebsitePageDto,
} from '#root/core/websites/dto/update_website_page_dto.js'
import { type Cheerio, type CheerioAPI, load as cheerioLoad } from 'cheerio'

export class GenerateWebsiteFromJsonTool {
  protected $: CheerioAPI
  constructor(protected content: Required<UpdateWebsitePageDto['draftWebsiteContent']>) {
    this.$ = cheerioLoad('<body></body>')
  }

  async createDomNodesAndAppendToNode(
    blocks: HTMLJsonBlock[],
    // biome-ignore lint/suspicious/noExplicitAny: Cheerio type
    node: Cheerio<any>,
  ) {
    if (!blocks || !blocks.length) {
      return
    }

    for (const block of blocks) {
      const blockNode = await this.createDomNodeFromContentBlock(block)

      if (blockNode) {
        node.append(blockNode)
      }
    }
  }

  async createDomNodeFromContentBlock(block: HTMLJsonBlock) {
    switch (block.type) {
      case 'container': {
        const container = this.$('<section>').addClass('kb-container')

        await this.createDomNodesAndAppendToNode(block.content, container)
        return container
      }
      case 'paragraph': {
        const paragraph = this.$('<p>').addClass('kb-paragraph')

        await this.createDomNodesAndAppendToNode(block.content, paragraph)

        return paragraph
      }
      case 'text': {
        const sliceOfText = this.$('<span>').addClass('kb-text-slice')

        if (block.text) {
          sliceOfText.text(block.text)
        }

        return sliceOfText
      }
      case 'columns': {
        const columns = this.$('<div>').addClass('kb-columns')

        await this.createDomNodesAndAppendToNode(block.content, columns)
        return columns
      }
      case 'column': {
        const column = this.$('<div>').addClass('kb-column')

        await this.createDomNodesAndAppendToNode(block.content, column)

        return column
      }
      case 'heading': {
        const level = block.attrs.level || 4
        const classes = `kb-heading kb-heading-level-${level}`
        const heading = this.$(`<h${level}>`).addClass(classes)

        await this.createDomNodesAndAppendToNode(block.content, heading)

        return heading
      }

      default:
        return null
    }
  }

  async toHtml() {
    if (!this.content?.content || !this.content?.content.length) {
      return this.$('section').html()
    }

    if (this.content?.content) {
      for (const block of this.content.content) {
        const domNode = await this.createDomNodeFromContentBlock(block)

        if (domNode) {
          this.$('body').append(domNode)
        }
      }
    }

    return this.$('body').html()
  }
}
