import { useServerFormMutation } from '@/pages/components/server-form-mutation/hooks/use-server-form-mutation.jsx'
import { usePageContext } from 'vike-react/usePageContext'

import { route } from '@/shared/routes/route_aliases.js'

export function useValidateBroadcastContentMutation() {
  const ctx = usePageContext()

  return useServerFormMutation({
    action: route('validate_broadcast', { uuid: ctx?.routeParams?.uuid }),
    method: 'PUT',
  })
}
