import { PageContainer, PageTitle } from '#root/pages/components/auth/auth.jsx'
import {
  ServerForm,
  useServerFormMutation,
} from '#root/pages/hooks/use_server_form_mutation.jsx'
import { Button } from '@kibamail/owly/button'
import * as TextField from '@kibamail/owly/text-field'
import { usePageContext } from 'vike-react/usePageContext'

import { route } from '#root/core/shared/routes/route_aliases.js'

function RegisterProfile() {
  const { user } = usePageContext()

  const { serverFormProps, error, isPending } = useServerFormMutation({
    action: route('auth_register_profile'),
  })

  return (
    <PageContainer>
      <PageTitle title="Tell us a bit about yourself" description="" />

      <ServerForm {...serverFormProps} className="mt-8 grid grid-cols-1 gap-y-4">
        <div className="grid grid-cols-2 gap-4">
          <TextField.Root
            name="firstName"
            placeholder="Max"
            defaultValue={user?.firstName ?? undefined}
          >
            <TextField.Label htmlFor="firstName">First name</TextField.Label>
            {error?.errorsMap?.firstName ? (
              <TextField.Error>{error.errorsMap.firstName}</TextField.Error>
            ) : null}
          </TextField.Root>
          <TextField.Root
            name="lastName"
            placeholder="Payne"
            defaultValue={user?.lastName ?? undefined}
          >
            <TextField.Label htmlFor="lastName">Last name</TextField.Label>

            {error?.errorsMap?.lastName ? (
              <TextField.Error>{error.errorsMap.lastName}</TextField.Error>
            ) : null}
          </TextField.Root>
        </div>

        <TextField.Root
          name="teamName"
          placeholder="The name of your team, business or company"
        >
          <TextField.Label htmlFor="lastName">Organisation name</TextField.Label>

          {error?.errorsMap?.teamName ? (
            <TextField.Error>{error.errorsMap.teamName}</TextField.Error>
          ) : null}
        </TextField.Root>

        <Button type="submit" width="full" loading={isPending}>
          Create account
        </Button>
      </ServerForm>
    </PageContainer>
  )
}

export { RegisterProfile as Page }
