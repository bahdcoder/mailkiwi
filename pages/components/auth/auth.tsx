import { GithubIcon } from '#root/pages/components/icons/github.svg.jsx'
import { GoogleIcon } from '#root/pages/components/icons/google.svg.jsx'
import { PasswordField } from '#root/pages/components/input/password-field.jsx'
import { Button } from '@kibamail/owly/button'
import { Heading } from '@kibamail/owly/heading'
import { Text } from '@kibamail/owly/text'
import * as TextField from '@kibamail/owly/text-field'
import type React from 'react'

import { route } from '#root/core/shared/routes/route_aliases.js'

export function PageContainer({ children }: React.PropsWithChildren) {
  return (
    <div className="w-full max-w-lg lg:max-w-100 mx-auto flex flex-col py-12 sm:py-16 lg:py-24">
      {children}
    </div>
  )
}

export interface PageTitleProps {
  title?: string | React.ReactNode
  description?: string | React.ReactNode
}

export const PageTitle = ({
  title,
  description,
}: React.PropsWithChildren<PageTitleProps>) => {
  return (
    <>
      <Heading variant="display" size="xs">
        {title}
      </Heading>

      <Text className="mt-2 kb-content-tertiary">{description}</Text>
    </>
  )
}

type AuthMethodsDividerProps = { children?: React.ReactNode }

export function AuthMethodsDivider({
  children,
}: React.PropsWithChildren<AuthMethodsDividerProps>) {
  return (
    <div className="mt-4 flex items-center">
      <div className="w-full h-px border-t kb-border-tertiary" />
      <Text className="shrink-0 px-4 kb-content-secondary">{children}</Text>
      <div className="w-full h-px border-t kb-border-tertiary" />
    </div>
  )
}

interface Oauth2MethodsProps {
  page: 'login' | 'register'
}

export function Oauth2Methods({ page }: Oauth2MethodsProps) {
  const content: Record<
    Oauth2MethodsProps['page'],
    Record<'google' | 'github', { link: string; title: string }>
  > = {
    login: {
      google: {
        title: 'Continue with Google',
        link: route('auth_oauth2_provider', {
          provider: 'google',
          action: 'login',
        }),
      },
      github: {
        title: 'Continue with Github',
        link: route('auth_oauth2_provider', {
          provider: 'github',
          action: 'login',
        }),
      },
    },
    register: {
      google: {
        title: 'Sign up with Google',
        link: route('auth_oauth2_provider', {
          provider: 'google',
          action: 'register',
        }),
      },
      github: {
        title: 'Sign up with github',
        link: route('auth_oauth2_provider', {
          provider: 'github',
          action: 'register',
        }),
      },
    },
  }

  return (
    <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 gap-2">
      <Button
        width="full"
        variant="secondary"
        className="[&>svg]:w-5 [&>svg]:h-5"
        asChild
      >
        <a href={content[page].google.link}>
          <GoogleIcon />
          {content[page].google.title}
        </a>
      </Button>
      <Button
        width="full"
        variant="secondary"
        className="[&>svg]:w-5 [&>svg]:h-5"
        asChild
      >
        <a href={content[page].github.link}>
          <GithubIcon />
          {content[page].github.title}
        </a>
      </Button>
    </div>
  )
}
