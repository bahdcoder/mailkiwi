import { usePageContext } from 'vike-react/usePageContext'
import type { DefaultPageProps } from '../types/page-context.js'
import type { PageContext } from 'vike/types'

export type PageContextWithPageProps<T extends object = object> = PageContext & {
  pageProps: T
}

export function usePageProps<T extends DefaultPageProps>() {
  const pageProps = usePageContext().pageProps as T

  return pageProps
}

export function usePageContextWithProps<T extends object = object>() {
  const ctx = usePageContext() as PageContext & { pageProps: T }

  return ctx
}
