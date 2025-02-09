import { useDebounceCallback } from "@react-hook/debounce"
import { MutationOptions, useMutation } from "@tanstack/react-query"
import { usePageContext } from "vike-react/usePageContext"

import { route } from "@/shared/routes/route_aliases.js"

export function useSyncComposerContentToServer(
  mutationOptions?: Omit<MutationOptions<any, any, any, any>, "mutationFn">,
) {
  const ctx = usePageContext()

  const syncContentToServerMutation = useMutation({
    async mutationFn({ emailContent }: { emailContent: Record<string, any> }) {
      await fetch(route("update_broadcast", { uuid: ctx?.routeParams?.uuid }), {
        method: "PUT",
        body: JSON.stringify({
          emailContent: {
            contentJson: emailContent,
          },
        }),
        headers: {
          "Content-Type": "application/json",
        },
      })
    },
    ...mutationOptions,
  })

  syncContentToServerMutation.mutate = useDebounceCallback(
    syncContentToServerMutation.mutate,
    1500,
  )

  return syncContentToServerMutation
}
