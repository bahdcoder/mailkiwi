import { EmailBuilderTool } from "@/emails/tools/email_builder/email_builder_tool.ts"
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
               <mj-wrapper css-class="wrapper" padding="32px 24px 32px 24px" background-color="red">
                  
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
        type: "grid",
        elements: [
          {
            name: "Logo",
            type: "grid-item",
            styles: {
              width: "25%",
            },
          },
          {
            name: "Navigation",
            type: "grid-item",
            styles: {
              width: "75%",
            },
            elements: [
              {
                name: "Login",
                type: "button",
                styles: {
                  backgroundColor: "#eee",
                  fontFamily: {
                    name: "Railway",
                    url: "https://fonts.googleapis.com/css2?family=Railway:wght@400;500;600;700&display=swap",
                  },
                  padding: {
                    top: 12,
                    left: 12,
                    right: 12,
                    bottom: 12,
                  },
                },
              },
            ],
          },
        ],
        styles: {
          backgroundColor: "#000",
          padding: {
            top: 12,
            left: 12,
            right: 12,
            bottom: 12,
          },
          borderRadius: {
            top: 8,
            left: 8,
            right: 8,
            bottom: 8,
          },
        },
      },
    ],
  }).build()

  test("renderes the font family and fallback family correctly", ({
    expect,
  }) => {
    expect(mjml.replace(/\s+/g, "")).toContain(
      `<mj-buttonpadding="12px12px12px12px"background-color="#eee"font-family="Railway,Montserrat"></mj-button>`,
    )
  })
})
