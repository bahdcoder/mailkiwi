import { CheckCircleSolidIcon } from '#root/pages/components/icons/check-circle-solid.svg.jsx'
import { Text } from '@kibamail/owly/text'
import type React from 'react'

type AuthPasswordsLayoutProps = { children?: React.ReactNode }

function AuthPasswordsLayout({
  children,
}: React.PropsWithChildren<AuthPasswordsLayoutProps>) {
  return <>{children}</>
}

export { AuthPasswordsLayout as Layout }
