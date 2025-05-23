import vikeReactQuery from 'vike-react-query/config'
import vikeReact from 'vike-react/config'
import type { Config } from 'vike/types'

export { config }

const config: Config = {
  title: 'kibamail - transactional, marketing and email automation platform.',
  stream: 'web',
  ssr: true,
  extends: [vikeReact, vikeReactQuery],
  passToClient: [
    'user',
    'team',
    'pageProps',
    'userAgent',
    'isMobile',
    'memberships',
    'flash',
    'audience',
    'tags',
    'engage',
    'send',
    'sendingDomains',
  ],
  bodyAttributes: { style: '--w-sidebar-width: 260px' },
}
