import { navigate as baseNavigate } from 'vike/client/router'

export function navigate(path: string): Promise<void> {
  return (baseNavigate as (path: string) => Promise<void>)?.(path)
}
