import { EmailContentSchemaDto } from "@/content/dto/create_email_content_dto.ts"

export function getDefaultEmailContentSchema(): EmailContentSchemaDto {
  return {
    sections: [],
    container: {
      styles: {
        backgroundColor: "#3CEDB9",
        margin: { top: 0, left: 0, right: 0, bottom: 0 },
        padding: { top: 24, left: 48, right: 48, bottom: 24 },
        borderRadius: { top: 0, left: 0, right: 0, bottom: 0 },
        fontFamily: {
          name: "Montserrat",
          url: "https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700&display=swap",
        },
      },
    },
    wrapper: {
      styles: {
        backgroundColor: "red",
        margin: { top: 0, left: 0, right: 0, bottom: 0 },
        padding: { top: 32, left: 24, right: 24, bottom: 32 },
        borderRadius: { top: 0, left: 0, right: 0, bottom: 0 },
        fontFamily: {
          name: "Arial",
          url: "https://fonts.googleapis.com/css2?family=Arial:wght@400;500;600;700&display=swap",
        },
        "min-height": 750,
        border: {
          top: 2,
          left: 2,
          right: 2,
          bottom: 2,
        },
        borderColor: {
          top: "#000",
          left: "#000",
          right: "#000",
          bottom: "#000",
        },
      },
    },
  }
}
