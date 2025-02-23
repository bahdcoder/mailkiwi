import { Page as LoginPage } from '@/pages/auth/login/+Page.jsx'
import React from 'react'
import { usePageContext } from 'vike-react/usePageContext'

function AcceptTeamInviteLoginPage() {
  const ctx = usePageContext()

  return <LoginPage teamInviteToken={ctx.routeParams?.['token']} />
}

export { AcceptTeamInviteLoginPage as Page }
