import {
  useServerFormMutation,
  type FormPayload,
} from '#root/pages/hooks/use_server_form_mutation.jsx'
import { toast } from 'sonner'

interface GenerateApiKeyResponse extends Record<string, unknown> {
  apiKey: string
}

export function useGenerateApiKey(
  name: string,
  capabilities: 'full' | 'send' | 'engage',
) {
  const mutation = useServerFormMutation<GenerateApiKeyResponse>({
    action: '/auth/api-keys',
    method: 'POST',
    onSuccess() {
      toast.success('API key generated successfully')
    },
    onError() {
      toast.error('Failed to generate API key. Please try again.')
    },
  })

  function generateApiKey() {
    const formPayload: FormPayload = {
      name,
      capabilities,
    }
    mutation.mutate(formPayload)
  }

  async function copyApiKey() {
    if (mutation.data?.payload?.apiKey) {
      try {
        await navigator.clipboard.writeText(mutation.data.payload.apiKey)
        toast.success('API key copied to clipboard')
      } catch (error) {
        toast.error('Failed to copy API key')
      }
    }
  }

  return {
    generateApiKey,
    copyApiKey,
    ...mutation,
  }
}
