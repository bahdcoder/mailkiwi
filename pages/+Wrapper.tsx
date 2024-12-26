import { i18n } from "@lingui/core"
import { I18nProvider } from "@lingui/react"
import { PropsWithChildren } from "react"
import { usePageContext } from "vike-react/usePageContext"

export default function LinguiI18nProvider({ children }: PropsWithChildren) {
  const pageContext = usePageContext()

  return <>{children}</>
}
