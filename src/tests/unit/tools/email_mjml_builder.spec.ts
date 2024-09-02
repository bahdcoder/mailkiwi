import { EmailBuilderTool } from "@/emails/tools/email_builder/email_builder_tool.ts"
import { EmailSnapshotTool } from "@/emails/tools/email_snapshot/email_snapshot_tool.ts"
import Path from "node:path"
import prettier from "prettier"
import { describe, test } from "vitest"

import { getDefaultEmailContentSchema } from "@/tests/mocks/emails/email_content.ts"

describe("mjml template builder", () => {
  test("builds the default root without any sections", async ({
    expect,
  }) => {
    const mjml = new EmailBuilderTool(
      getDefaultEmailContentSchema(),
    ).build()

    expect(mjml).toMatchInlineSnapshot(`
      "
          <mjml>
            <mj-head>
               <mj-style>
                  .body {
                    padding: 24px 48px 24px 48px;
                  }
                  .wrapper { min-height: 750px }
               </mj-style>
               <mj-font name="Montserrat" href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700&display=swap"></mj-font>
            </mj-head>
            <mj-body css-class="body" background-color="#3CEDB9">
               <mj-wrapper css-class="wrapper" padding="32px 24px 32px 24px" background-color="white">
                  
               </mj-wrapper>
            </mj-body>
         </mjml>"
    `)
  })
})

describe("renders all content of the mjml template correctly", () => {
  const mjml = new EmailBuilderTool({
    ...getDefaultEmailContentSchema(),
    sections: [
      {
        name: "Header",
        type: "section",
        elements: [
          {
            name: "Header grid",
            type: "grid",
            styles: {},
            elements: [
              {
                name: "Logo",
                type: "grid-item",
                styles: {
                  width: "45%",
                },
                elements: [
                  {
                    type: "image",
                    value:
                      "https://api-postcards.designmodo.com/files/images/user-9614/image-17250635448320.svg",
                    styles: {
                      width: "160px",
                      horizontalAlign: "left",
                    },
                  },
                ],
              },
              {
                name: "Navigation",
                type: "grid-item",
                styles: {
                  width: "55%",
                  horizontalAlign: "right",
                },
                elements: [
                  {
                    name: "Navigation grid",
                    type: "grid",
                    styles: {},
                    elements: [
                      {
                        name: "Navigation grid item",
                        styles: {},
                        type: "grid-item",
                        elements: [
                          {
                            name: "Enterprise",
                            type: "button",
                            properties: {
                              href: {
                                url: "https://www.google.com",
                              },
                            },
                            styles: {
                              fontFamily: {
                                name: "Railway",
                                url: "https://fonts.googleapis.com/css2?family=Railway:wght@400;500;600;700&display=swap",
                              },
                              padding: {
                                top: 0,
                                right: 0,
                                bottom: 0,
                                left: 0,
                              },
                              margin: {
                                top: 0,
                                right: 0,
                                bottom: 0,
                                left: 0,
                              },
                              textDecoration: "none",
                            },
                            elements: [
                              {
                                type: "text",
                                value: "Enterprise",
                                elements: [],
                                styles: {
                                  color: "white",
                                },
                              },
                            ],
                          },
                        ],
                      },
                      {
                        name: "Navigation grid item",
                        styles: {},
                        type: "grid-item",

                        elements: [
                          {
                            name: "Pricing",
                            type: "button",
                            properties: {
                              href: {
                                url: "https://www.google.com",
                              },
                            },
                            styles: {
                              fontFamily: {
                                name: "Railway",
                                url: "https://fonts.googleapis.com/css2?family=Railway:wght@400;500;600;700&display=swap",
                              },
                              textDecoration: "none",
                              padding: {
                                top: 0,
                                right: 0,
                                bottom: 0,
                                left: 0,
                              },
                              margin: {
                                top: 0,
                                right: 0,
                                bottom: 0,
                                left: 0,
                              },
                            },
                            elements: [
                              {
                                type: "grid",
                                value: "Pricing",
                                elements: [
                                  {
                                    type: "grid-item",
                                    elements: [],
                                    styles: {
                                      width: "100%",
                                    },
                                  },
                                ],
                                styles: {
                                  color: "white",
                                },
                              },
                            ],
                          },
                        ],
                      },

                      {
                        name: "Navigation grid item",
                        styles: {},
                        type: "grid-item",
                        elements: [
                          {
                            name: "Solutions",
                            type: "button",
                            properties: {
                              href: {
                                url: "https://www.google.com",
                              },
                            },
                            styles: {
                              fontFamily: {
                                name: "Railway",
                                url: "https://fonts.googleapis.com/css2?family=Railway:wght@400;500;600;700&display=swap",
                              },
                              padding: {
                                top: 0,
                                right: 0,
                                bottom: 0,
                                left: 0,
                              },
                              margin: {
                                top: 0,
                                right: 0,
                                bottom: 0,
                                left: 0,
                              },
                              textDecoration: "none",
                            },
                            elements: [
                              {
                                type: "text",
                                value: "Solutions",
                                elements: [],
                                styles: {
                                  color: "white",
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
          },
        ],
        styles: {
          backgroundColor: "#243361",
          padding: {
            top: 20,
            left: 40,
            right: 24,
            bottom: 40,
          },
        },
      },
    ],
  }).build()

  test.only(
    "renders the font family and fallback family of a button correctly",
    async ({ expect }) => {
      console.log(mjml)
      await new EmailSnapshotTool(mjml)
        .prefix("render-font-family-of-a-button")
        .snapshot()
      // expect(mjml.replace(/\s+/g, "")).toContain(
      //   `<mj-buttonpadding="12px12px12px12px"background-color="#eee"font-family="Railway,Montserrat"></mj-button>`,
      // )
    },
    { timeout: 10_000 },
  )
})
