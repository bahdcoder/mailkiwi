import { useServerFormMutation } from '#root/pages/hooks/use_server_form_mutation.jsx'
import { toast } from 'sonner'

interface SendTestEmailResponse extends Record<string, unknown> {
  messages: Array<{ messageId: string }>
}

export function useSendTestEmail() {
  const mutation = useServerFormMutation<SendTestEmailResponse>({
    action: '/send/emails/test',
    method: 'POST',
    onSuccess() {
      toast.success('Test email sent successfully')
    },
    onError() {
      toast.error('Failed to send test email. Please try again.')
    },
  })

  function sendTestEmail() {
    mutation.mutate({})
  }

  return {
    sendTestEmail,
    ...mutation,
  }
}
