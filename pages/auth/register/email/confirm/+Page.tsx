import './page.css'
import { PageContainer, PageTitle } from '#root/pages/components/auth/auth.jsx'
import {
  ServerForm,
  useServerFormMutation,
} from '#root/pages/hooks/use_server_form_mutation.jsx'
import { Button } from '@kibamail/owly/button'
import * as CodeInput from '@kibamail/owly/code-input'
import { Text } from '@kibamail/owly/text'
import React from 'react'

function EmailConfirmPage() {
  const formRef = React.useRef<HTMLFormElement>(null)

  const { serverFormProps, isPending, error } = useServerFormMutation({
    action: '/auth/register/email/confirm',
  })

  return (
    <PageContainer>
      <div className="mb-10">
        <img src="/icons/email-send.svg" alt="Email sent" />
      </div>
      <PageTitle
        title="Enter the code sent to your email"
        description={
          <Text as="label" htmlFor="code">
            <span className="kb-content-tertiary">
              We have sent a code to your email address. Please enter the code below to
              confirm your email address
            </span>
            <span className="kb-content-primary">{'frantz@kibamail.com'}</span>.
          </Text>
        }
      />

      <div className="grid grid-cols-1 gap-y-10">
        <ServerForm
          {...serverFormProps}
          className="flex flex-col w-full pt-6 gap-y-6"
          ref={formRef}
        >
          <CodeInput.Input autoFocus name="code" id="code">
            {error?.errorsMap?.code ? (
              <CodeInput.Error>{error?.errorsMap?.code}</CodeInput.Error>
            ) : null}
          </CodeInput.Input>
          {/* TODO: PROVIDE A SUBMIT BUTTON FOR FORMS WITH NO JS */}

          <Button type="submit" loading={isPending}>
            Confirm your email
          </Button>
        </ServerForm>

        <Text>
          Didn{"'"}t receive mail? Check your spam folder or
          <Button
            type="button"
            variant="tertiary"
            className="kb-content-link underline pl-0 ml-1"
          >
            Send again
          </Button>
        </Text>
      </div>
    </PageContainer>
  )
}

export { EmailConfirmPage as Page }
