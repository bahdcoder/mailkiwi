import {
  AuthMethodsDivider,
  Oauth2Methods,
  PageContainer,
  PageTitle,
} from '#root/pages/components/auth/auth.jsx'
import { FlashMessage } from '#root/pages/components/flash/flash_message.jsx'
import {
  ServerForm,
  useServerFormMutation,
} from '#root/pages/hooks/use_server_form_mutation.jsx'
import { Button } from '@kibamail/owly/button'
import { Text } from '@kibamail/owly/text'
import * as TextField from '@kibamail/owly/text-field'
import React from 'react'

interface RegisterPageProps {
  teamInviteToken?: string
}

function RegisterPage({ teamInviteToken }: RegisterPageProps) {
  const isAnInvitedUser = teamInviteToken !== undefined

  const { serverFormProps, isPending, error } = useServerFormMutation({
    action: '/auth/register',
  })

  const linkToLoginPage = isAnInvitedUser
    ? `/auth/invites/${teamInviteToken}/login`
    : '/auth/login'

  return (
    <PageContainer>
      <PageTitle
        title={
          isAnInvitedUser ? (
            <span className="kb-content-disabled">
              You{"'"}ve been invited to join{' '}
              <span className="kb-content-brand">Zibaletter</span>.
            </span>
          ) : (
            'Welcome to a new world of Emailing.'
          )
        }
        description={
          isAnInvitedUser
            ? 'Sign up or login to join the Zibaletter workspace.'
            : 'Choose your preferred method to access powerful emailing tools.'
        }
      />

      <FlashMessage className="mt-10" />

      <Oauth2Methods page="register" />

      <AuthMethodsDivider>Or signup with</AuthMethodsDivider>

      <ServerForm {...serverFormProps} className="flex flex-col w-full py-4">
        <div className="grid grid-cols-1 gap-4">
          <TextField.Root
            id="email"
            name="email"
            required
            type="email"
            placeholder="Enter your work email address"
          >
            <TextField.Label htmlFor="email">Email address</TextField.Label>
            {error?.errorsMap?.email ? (
              <TextField.Error>{error?.errorsMap?.email}</TextField.Error>
            ) : null}
          </TextField.Root>
        </div>

        <Button type="submit" width="full" className="mt-2" loading={isPending}>
          Sign up
        </Button>
      </ServerForm>

      <div className="flex justify-center">
        <Text>
          Already have an account?
          <a className="ml-2 underline kb-content-info" href={linkToLoginPage}>
            Login
          </a>
        </Text>
      </div>
    </PageContainer>
  )
}

export { RegisterPage as Page }
