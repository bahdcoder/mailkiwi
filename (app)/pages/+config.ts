import vikeReactQuery from "vike-react-query/config"
import vikeReact from "vike-react/config"
import type { Config } from "vike/types"

export { config }

const config: Config = {
  title: "Kibamail",
  stream: true,
  ssr: true,
  bodyAttributes: { class: "dark" },
  viewport: 999,
  extends: [vikeReact, vikeReactQuery],
  passToClient: ["user", "team", "pageProps"],
}
