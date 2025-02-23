import { Page as RegisterPage } from '@/pages/auth/register/+Page.jsx'
import React from 'react'
import { usePageContext } from 'vike-react/usePageContext'

function AcceptTeamInvitePage() {
  const ctx = usePageContext()

  return <RegisterPage teamInviteToken={ctx.routeParams?.token} />
}

export { AcceptTeamInvitePage as Page }
