import { useServerFormMutation } from '@/pages/hooks/use_server_form_mutation.jsx'
import { usePageContext } from 'vike-react/usePageContext'

import { route } from '@/shared/routes/route_aliases.js'

export function useValidateBroadcastContentMutation() {
  const ctx = usePageContext()

  return useServerFormMutation({
    action: route('validate_broadcast', { uuid: ctx?.routeParams?.uuid }),
    method: 'PUT',
  })
}
