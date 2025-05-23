import { Page as RegisterPage } from '#root/pages/auth/register/+Page.jsx'
import React from 'react'
import { usePageContext } from 'vike-react/usePageContext'

function AcceptTeamInvitePage() {
  const { routeParams } = usePageContext()

  return <RegisterPage teamInviteToken={routeParams?.token} />
}

export { AcceptTeamInvitePage as Page }
