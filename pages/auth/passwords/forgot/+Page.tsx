import {
  ServerForm,
  useServerFormMutation,
} from '#root/pages/hooks/use_server_form_mutation.jsx'
import { Button } from '@kibamail/owly/button'
import { Heading } from '@kibamail/owly/heading'
import { Text } from '@kibamail/owly/text'
import * as TextField from '@kibamail/owly/text-field'

import { route } from '#root/core/shared/routes/route_aliases.js'

function ForgotPasswordPage() {
  const { serverFormProps, error, isSuccess } = useServerFormMutation({
    action: route('auth_passwords_forgot'),
  })

  return (
    <div className="w-full max-w-100 mx-auto mt-24">
      {isSuccess ? (
        <img src="/icons/email-send.svg" className="mb-4" alt="Email sent icon" />
      ) : null}
      <Heading className="mb-2">Reset password</Heading>

      {isSuccess ? (
        <Text className="kb-content-tertiary mt-2">
          We received your request to reset your email. If an account exists with the
          email{' '}
          <span className="kb-content-secondary font-semibold">
            {'bahdcoder@gmail.com'}
          </span>{' '}
          you
          {"'"}ll receive an email with a password reset link soon.
        </Text>
      ) : (
        <Text className="kb-content-tertiary mt-2">
          Enter your email address. If an account exists, you{"'"}ll receive an email with
          a password reset link soon.
        </Text>
      )}

      {isSuccess ? (
        <Button className="mt-10" width={'full'} variant="secondary" asChild>
          <a href={route('auth_login')}>Back to login</a>
        </Button>
      ) : null}

      {isSuccess ? null : (
        <ServerForm {...serverFormProps} className="mt-10 flex flex-col">
          <TextField.Root
            required
            id="email"
            type="email"
            name="email"
            placeholder="Enter your account email address"
          >
            <TextField.Label htmlFor="email">Email address</TextField.Label>

            {error?.errorsMap?.email ? (
              <TextField.Error> {error?.errorsMap?.email} </TextField.Error>
            ) : null}
          </TextField.Root>

          <div className="grid grid-cols-1 gap-2 w-full mt-6">
            <Button type="submit" width={'full'}>
              Continue
            </Button>

            <Button variant="tertiary" width="full" asChild>
              <a href={route('auth_login')}>Back to login</a>
            </Button>
          </div>
        </ServerForm>
      )}
    </div>
  )
}

export { ForgotPasswordPage as Page }
