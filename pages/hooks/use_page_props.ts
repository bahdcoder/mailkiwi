import { usePageContext } from 'vike-react/usePageContext'

export function usePageProps<T extends object>() {
  const ctx = usePageContext()

  return ctx.pageProps as T
}
