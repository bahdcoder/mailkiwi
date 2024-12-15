import vikeReactQuery from "vike-react-query/config"
import vikeReact from "vike-react/config"
import type { Config } from "vike/types"

export { config }

const config: Config = {
  title: "Kibamail - Transactional, marketing and email automation platform.",
  stream: true,
  ssr: true,
  extends: [vikeReact, vikeReactQuery],
  passToClient: [
    "user",
    "team",
    "pageProps",
    "userAgent",
    "isMobile",
    "memberships",
    "flash",
  ],
}
