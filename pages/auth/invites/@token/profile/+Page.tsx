import { PageContainer, PageTitle } from '#root/pages/components/auth/auth.jsx'
import { Button } from '@kibamail/owly/button'
import * as TextField from '@kibamail/owly/text-field'
import React from 'react'

function AcceptInviteCreateProfile() {
  return (
    <PageContainer>
      <PageTitle
        title={
          <span className="kb-content-disabled">
            You{"'"}ve been invited to join{' '}
            <span className="kb-content-brand">Zibaletter</span>.
          </span>
        }
        description={'Complete your profile to join the Zibaletter workspace.'}
      />

      <form action="" className="mt-8 flex flex-col gap-y-6">
        <div className="flex flex-col lg:flex-row gap-y-4 lg:gap-y-0 lg:items-center lg:gap-x-4">
          <TextField.Root id="firstName" placeholder="Zackary">
            <TextField.Label htmlFor="firstName">First name</TextField.Label>
          </TextField.Root>
          <TextField.Root id="lastName" placeholder="Putler">
            <TextField.Label htmlFor="lastName">Last name</TextField.Label>
          </TextField.Root>
        </div>

        <Button width="full">Continue</Button>
      </form>
    </PageContainer>
  )
}

export { AcceptInviteCreateProfile as Page }
