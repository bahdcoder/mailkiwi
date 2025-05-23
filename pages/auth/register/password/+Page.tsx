import { PageContainer, PageTitle } from '#root/pages/components/auth/auth.jsx'
import { PasswordField } from '#root/pages/components/input/password-field.jsx'
import {
  ServerForm,
  useServerFormMutation,
} from '#root/pages/hooks/use_server_form_mutation.jsx'
import { Button } from '@kibamail/owly/button'
import * as TextField from '@kibamail/owly/text-field'
import React from 'react'

function RegisterPasswordPage() {
  const { serverFormProps, isPending, error } = useServerFormMutation({
    action: '/auth/register/password',
  })

  return (
    <PageContainer>
      <PageTitle
        title="Create your password"
        description="Choose a secure password to enable access to your account."
      />

      <ServerForm {...serverFormProps} className="flex flex-col w-full py-4 mt-10">
        <div className="grid grid-cols-1 gap-4 relative">
          <PasswordField
            placeholder="Create your password"
            strengthIndicator
            name="password"
          >
            {error?.errorsMap?.password ? (
              <TextField.Error className="mt-8">
                {error.errorsMap.password}
              </TextField.Error>
            ) : null}
          </PasswordField>
        </div>

        <Button type="submit" width="full" className="mt-6" loading={isPending}>
          Continue
        </Button>
      </ServerForm>
    </PageContainer>
  )
}

export { RegisterPasswordPage as Page }
