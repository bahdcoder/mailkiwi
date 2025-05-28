import { LogoutIcon } from '#root/pages/components/icons/logout.svg.jsx'
import {
  ServerForm,
  useServerFormMutation,
} from '#root/pages/hooks/use_server_form_mutation.jsx'
import { Text } from '@kibamail/owly/text'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'

import { route } from '#root/core/shared/routes/route_aliases.js'

export function SignoutForm() {
  const { serverFormProps } = useServerFormMutation({
    action: route('auth_logout'),
  })

  return (
    <ServerForm {...serverFormProps}>
      <DropdownMenu.Item className="rounded-lg">
        <button
          type="submit"
          className="p-2 flex w-full items-center hover:bg-(--background-secondary) rounded-lg cursor-pointer"
        >
          <LogoutIcon className="mr-1.5 w-5 h-5 kb-content-tertiary" />
          <Text>Sign out</Text>
        </button>
      </DropdownMenu.Item>
    </ServerForm>
  )
}
