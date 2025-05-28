import fs from 'node:fs/promises'
import path from 'node:path'
import {
  type EmailTemplateSchema,
  FoundationEmailBuilderTool,
} from '#root/core/emails/tools/foundation_email_builder/foundation_email_builder_tool.js'
import { Edge } from 'edge.js'
import { describe, test } from 'vitest'

describe('Emails with Foundation v2 framework', () => {
  const Inky = require('inky').Inky
  const cheerio = require('cheerio')

  test('correctly generates inky templates', async ({ expect }) => {
    const inky = new Inky()

    const foundationFile = path.resolve(
      process.cwd(),
      'core',
      'static',
      'emails',
      'foundation',
      'foundation_email_template.edge',
    )
    const foundationCssFile = path.resolve(
      process.cwd(),
      'core',
      'static',
      'emails',
      'foundation',
      'foundation_email_styles.css',
    )

    const foundation = await fs.readFile(foundationFile, 'utf-8')
    const foundationCss = await fs.readFile(foundationCssFile, 'utf-8')

    const schema: EmailTemplateSchema = {
      global: {
        style: {
          'background-color': '#eee',
          padding: '0px 0px 0px',
          'font-family': "'IBM Plex Mono', Helvetica, Arial, sans-serif",
        },
        largeStyle: {
          // styles on desktop
        },
        webFonts: [
          'https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;1,100;1,200;1,300;1,400;1,500;1,600;1,700&family=Rethink+Sans:ital,wght@0,400..800;1,400..800&display=swa',
        ],
      },
      sections: [
        {
          name: 'Hero',
          type: 'row',
          elements: [
            {
              name: 'Hero image column',
              type: 'column',
              // mobile first
              properties: {
                width: 12,
                align: 'center',
                valign: 'bottom',
              },
              largeProperties: {
                width: 4,
                align: 'right',
              },
              elements: [
                {
                  name: 'Hero image',
                  type: 'image',
                  properties: {
                    src: 'http://placehold.it/125x200',
                    alt: 'this is just a placeholder image',
                    align: 'center', // wrapped with <center></center> tags for center, float-left for align left and float-right for align right
                  },
                },
              ],
            },
            {
              name: 'Hero text column',
              type: 'column',
              properties: {
                width: 12,
              },
              largeProperties: {
                width: 8,
              },
              elements: [
                {
                  name: 'Hero text',
                  type: 'heading',
                  properties: {
                    size: 1, // h1, h2, h3, etc
                  },
                  style: {
                    'font-family': "'Rethink Sans'",
                    'text-transform': 'uppercase',
                  },
                  elements: [
                    {
                      type: 'text',
                      value: 'Do Some',
                    },
                    {
                      type: 'text',
                      value: 'thing Radical With This App',
                    },
                  ],
                },
                {
                  name: 'Hero button',
                  type: 'button',
                  properties: {
                    href: 'https://google.com/signup',
                  },
                },
              ],
            },
          ],
        },
        {
          name: 'Feature space',
          type: 'spacer',
          properties: {
            height: 16,
          },
        },
        {
          name: 'Features',
          type: 'row',
          elements: [
            {
              name: 'Features title',
              type: 'heading',
              properties: {
                size: 3,
                align: 'center',
              },
              elements: [
                {
                  type: 'text',
                  value: 'It has Never Been Easier to Do Things.',
                },
              ],
            },
            {
              name: 'Feature description',
              type: 'paragraph',
              properties: {
                align: 'center',
              },
              elements: [
                {
                  type: 'text',
                  value:
                    'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam in dui mauris.',
                },
                {
                  type: 'text',
                  value:
                    'Vivamus hendrerit arcu sed erat molestie vehicula. Sed auctor neque eu tellus rhoncus ut eleifend nibh porttitor. Ut in nulla enim. Phasellus molestie magna non est bibendum non venenatis nisl tempor. Suspendisse dictum f',
                },
              ],
            },
          ],
        },
        {
          name: 'Feature space middle',
          type: 'spacer',
          properties: {
            height: 16,
          },
        },
        {
          name: 'List of features',
          type: 'row',
          elements: [
            {
              type: 'column',
              properties: {
                width: 12,
              },
              largeProperties: {
                width: 4,
              },
              elements: [
                {
                  type: 'image',
                  properties: {
                    align: 'center',
                    src: 'http://placehold.it/50x50',
                  },
                },
                {
                  type: 'heading',
                  properties: {
                    size: 5,
                    align: 'center',
                  },
                  elements: [
                    {
                      type: 'text',
                      value: 'Feature One',
                    },
                  ],
                },
                {
                  type: 'paragraph',
                  properties: {
                    align: 'center',
                  },
                  elements: [
                    {
                      type: 'text',
                      value:
                        'Lorem ipsum dolor sit amet, consectetur adipisicing elit. Rerum, quod quam unde earum.',
                    },
                  ],
                },
              ],
            },
            {
              type: 'column',
              properties: {
                width: 12,
              },
              largeProperties: {
                width: 4,
              },
              elements: [
                {
                  type: 'image',
                  properties: {
                    align: 'center',
                    src: 'http://placehold.it/50x50',
                  },
                },
                {
                  type: 'heading',
                  properties: {
                    size: 5,
                    align: 'center',
                  },
                  elements: [
                    {
                      type: 'text',
                      value: 'Feature Two',
                    },
                  ],
                },
                {
                  type: 'paragraph',
                  properties: {
                    align: 'center',
                  },
                  elements: [
                    {
                      type: 'text',
                      value:
                        'Lorem ipsum dolor sit amet, consectetur adipisicing elit. Rerum, quod quam unde earum.',
                    },
                  ],
                },
              ],
            },
            {
              type: 'column',
              properties: {
                width: 12,
              },
              largeProperties: {
                width: 4,
              },
              elements: [
                {
                  type: 'image',
                  properties: {
                    align: 'center',
                    src: 'http://placehold.it/50x50',
                  },
                },
                {
                  type: 'heading',
                  properties: {
                    size: 5,
                    align: 'center',
                  },
                  elements: [
                    {
                      type: 'text',
                      value: 'Feature Three',
                    },
                  ],
                },
                {
                  type: 'paragraph',
                  properties: {
                    align: 'center',
                  },
                  elements: [
                    {
                      type: 'text',
                      value:
                        'Lorem ipsum dolor sit amet, consectetur adipisicing elit. Rerum, quod quam unde earum.',
                    },
                  ],
                },
              ],
            },
          ],
        },
        {
          name: 'Feature space bottom',
          type: 'spacer',
          properties: {
            height: 16,
          },
        },
        {
          name: 'Call to action',
          type: 'row',
          elements: [
            {
              type: 'column',
              largeProperties: {
                width: 12,
              },
              elements: [
                {
                  type: 'spacer',
                  properties: {
                    height: 16,
                  },
                },
                {
                  type: 'heading',
                  properties: {
                    size: 3,
                  },
                  elements: [
                    {
                      type: 'text',
                      value: 'What are you waiting for? Get started today!',
                    },
                  ],
                },
                {
                  type: 'button',
                  properties: {
                    width: 12, // full width of entire container
                    href: 'https://google.com/signup',
                  },
                  style: {
                    'background-color': 'purple',
                    background: 'purple',
                    color: 'white',
                  },
                  elements: [
                    {
                      type: 'text',
                      value: 'Sign',
                    },
                    {
                      type: 'text',
                      value: ' Up',
                    },
                  ],
                },
              ],
            },
          ],
        },
        {
          name: 'Footer',
          type: 'row',
          properties: {
            collapsed: true,
            footer: true,
          },
          elements: [
            {
              type: 'column',
              elements: [
                {
                  type: 'spacer',
                  properties: {
                    height: 16,
                  },
                },
                {
                  type: 'paragraph',
                  properties: {
                    align: 'center',
                  },
                  elements: [
                    {
                      type: 'text',
                      value: '©2018 @copywrite menas',
                    },
                  ],
                },
                {
                  type: 'paragraph',
                  properties: {
                    align: 'center',
                  },
                  elements: [
                    {
                      type: 'text',
                      value: 'hello@nocopywrite.com | ',
                    },
                    {
                      type: 'text',
                      value: 'Manage notifications | ',
                      properties: {
                        href: 'https://microsoft.com/manage',
                      },
                    },
                    {
                      type: 'text',
                      value: 'Unsubscribe',
                      properties: {
                        href: 'https://microsoft.com/unsubscribe',
                      },
                    },
                  ],
                },
                {
                  type: 'menu',
                  properties: {
                    align: 'center', // wrap menu inside "center" tags
                  },
                  elements: [
                    {
                      type: 'menu-item',
                      elements: [
                        {
                          type: 'image',
                          properties: {
                            src: 'http://placehold.it/25',
                          },
                        },
                      ],
                    },
                    {
                      type: 'menu-item',
                      elements: [
                        {
                          type: 'image',
                          properties: {
                            src: 'http://placehold.it/25',
                          },
                        },
                      ],
                    },
                    {
                      type: 'menu-item',
                      elements: [
                        {
                          type: 'image',
                          properties: {
                            src: 'http://placehold.it/25',
                          },
                        },
                      ],
                    },
                    {
                      type: 'menu-item',
                      elements: [
                        {
                          type: 'image',
                          properties: {
                            src: 'http://placehold.it/25',
                          },
                        },
                      ],
                    },
                    {
                      type: 'menu-item',
                      elements: [
                        {
                          type: 'image',
                          properties: {
                            src: 'http://placehold.it/25',
                          },
                        },
                      ],
                    },
                    {
                      type: 'menu-item',
                      elements: [
                        {
                          type: 'image',
                          properties: {
                            src: 'http://placehold.it/25',
                          },
                        },
                      ],
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    }

    const out = new FoundationEmailBuilderTool(schema).build()

    const email = inky.releaseTheKraken(cheerio.load(out.sections))

    const edge = Edge.create()

    const rendered = await edge.renderRaw(foundation, {
      title: 'Newsletter beehiv',
      content: email,
      framework_css: foundationCss,
      content_css: out.globalStyles,
      head: out.webFonts,
    })
    expect(rendered).toMatchSnapshot()
  })
})
