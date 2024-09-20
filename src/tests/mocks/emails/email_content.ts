import { EmailContentSchemaDto } from "@/content/dto/create_email_content_dto.js"

export function getDefaultEmailContentSchema(): EmailContentSchemaDto {
  return {
    sections: [],
    container: {
      styles: {
        backgroundColor: "#F4F4F4",
        margin: { top: 0, left: 0, right: 0, bottom: 0 },
        padding: { top: 20, left: 0, right: 0, bottom: 20 },
        borderRadius: { top: 0, left: 0, right: 0, bottom: 0 },
        fontFamily: {
          name: "Montserrat",
          url: "https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700&display=swap",
        },
      },
    },
    wrapper: {
      styles: {
        backgroundColor: "#243361",
        margin: { top: 0, left: 0, right: 0, bottom: 0 },
        borderRadius: { top: 0, left: 0, right: 0, bottom: 0 },
        fontFamily: {
          name: "Arial",
          url: "https://fonts.googleapis.com/css2?family=Arial:wght@400;500;600;700&display=swap",
        },
        "min-height": 750,
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
