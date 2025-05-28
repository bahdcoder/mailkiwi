import {
  AuthMethodsDivider,
  Oauth2Methods,
  PageContainer,
  PageTitle,
} from '#root/pages/components/auth/auth.jsx'
import { FlashMessage } from '#root/pages/components/flash/flash_message.jsx'
import { PasswordField } from '#root/pages/components/input/password-field.jsx'
import {
  ServerForm,
  useServerFormMutation,
} from '#root/pages/hooks/use_server_form_mutation.jsx'
import { Button } from '@kibamail/owly/button'
import { Text } from '@kibamail/owly/text'
import * as TextField from '@kibamail/owly/text-field'
import React from 'react'

import { route } from '#root/core/shared/routes/route_aliases.js'
import { usePageContext } from 'vike-react/usePageContext'

interface LoginPageProps {
  teamInviteToken?: string
}

function LoginPage({ teamInviteToken }: LoginPageProps) {
  const isAnInvitedUser = teamInviteToken !== undefined

  const props = usePageContext()

  const linkToRegisterPage = isAnInvitedUser
    ? `/auth/invites/${teamInviteToken}/`
    : '/auth/register'

  const { serverFormProps, error, isPending } = useServerFormMutation({
    action: '/auth/login',
  })

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

      <Oauth2Methods page="login" />

      <AuthMethodsDivider>Or continue with</AuthMethodsDivider>

      <ServerForm {...serverFormProps} className="flex flex-col w-full py-4">
        <div className="grid grid-cols-1 gap-4">
          <TextField.Root
            id="email"
            placeholder="Enter your work email address"
            name="email"
          >
            <TextField.Label htmlFor="email">Email address</TextField.Label>

            {error?.errorsMap?.email ? (
              <TextField.Error>{error?.errorsMap?.email}</TextField.Error>
            ) : null}
          </TextField.Root>

          <PasswordField name="password">
            {error?.errorsMap?.password ? (
              <TextField.Error>{error?.errorsMap?.password}</TextField.Error>
            ) : null}
          </PasswordField>
        </div>

        <div className="flex justify-end">
          <Button asChild variant="tertiary" className="underline">
            <a href={route('auth_passwords_forgot')}>Forgot your password ?</a>
          </Button>
        </div>

        <Button type="submit" loading={isPending} width="full" className="mt-2">
          Continue
        </Button>
      </ServerForm>

      <div className="flex justify-center">
        <Text>
          Don{"'"}t have an account?
          <a className="ml-2 underline kb-content-info" href={linkToRegisterPage}>
            Create an account
          </a>
        </Text>
      </div>
    </PageContainer>
  )
}

export { LoginPage as Page }
