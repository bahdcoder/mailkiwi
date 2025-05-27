import { Divider } from '#root/pages/components/divider/divider.jsx'
import { Button } from '@kibamail/owly/button'
import { Heading } from '@kibamail/owly/heading'
import { Text } from '@kibamail/owly/text'
import * as TextField from '@kibamail/owly/text-field'
import { usePageContext } from 'vike-react/usePageContext'

import {
  ServerForm,
  useServerFormMutation,
} from '#root/pages/hooks/use_server_form_mutation.jsx'

import { route } from '#root/core/shared/routes/route_aliases.js'

function ProfilePage() {
  const { user } = usePageContext()
  const { serverFormProps, error, isPending } = useServerFormMutation({
    action: route('auth_register_profile'),
  })
  return (
    <div className="w-full max-w-2xl mx-auto py-4 lg:py-16 grid grid-cols-1 gap-y-4 p-4">
      <Heading size="md" variant="heading" className="kb-content-secondary">
        Profile
      </Heading>
      <Text className="kb-content-tertiary -mt-2">
        Forem ipsum dolor sit amet, consectetur adipiscing elit
      </Text>

      <Divider className="my-4 border-e-red-500" />

      <div className="flex flex-col gap-6 pt-5">
        <div className="flex gap-5">
          <div className="grid grid-cols-2 gap-4 flex-1">
            <TextField.Root
              name="firstName"
              placeholder="Max"
              defaultValue={user?.firstName ?? undefined}
            >
              <TextField.Label htmlFor="firstName" className="kb-content-tertiary">
                First name
              </TextField.Label>
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

          <div className="flex items-end w-40 justify-end">
            <Button variant="secondary" type="submit" onClick={() => ''}>
              Change
            </Button>
          </div>
        </div>

        <div className="flex gap-5">
          <div className="flex flex-col gap-2 flex-1">
            <span className="kb-content-secondary">Email address</span>
            <Text className="kb-content-tertiary">email@email.com</Text>
          </div>

          <div className="flex items-end w-40 justify-end">
            <Button variant="secondary" type="submit" onClick={() => ''}>
              Change email
            </Button>
          </div>
        </div>

        <div className="flex gap-5">
          <div className="flex flex-col gap-2 flex-1">
            <span className="kb-content-secondary">Password</span>
            <Text className="kb-content-tertiary">
              Set permanent password to log into your account
            </Text>
          </div>

          <div className="flex items-end w-40 justify-end">
            <Button variant="secondary" type="submit" onClick={() => ''}>
              Change password
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

export { ProfilePage as Page }
