import { useServerFormMutation } from '#root/pages/hooks/use_server_form_mutation.jsx'
import { usePageContext } from 'vike-react/usePageContext'

import { route } from '#root/core/shared/routes/route_aliases.js'

export function useValidateBroadcastContentMutation() {
  const { routeParams } = usePageContext()

  return useServerFormMutation({
    action: route('validate_broadcast', { uuid: routeParams?.uuid }),
    method: 'PUT',
  })
}
