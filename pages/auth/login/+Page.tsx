import {
  AuthMethodsDivider,
  Oauth2Methods,
  PageContainer,
  PageTitle,
} from "@/components/auth/auth.jsx"
import { PasswordField } from "@/components/input/password-field.jsx"
import { Button } from "@kibamail/owly/button"
import { Text } from "@kibamail/owly/text"
import * as TextField from "@kibamail/owly/text-field"
import React from "react"

interface LoginPageProps {
  teamInviteToken?: string
}

function LoginPage({ teamInviteToken }: LoginPageProps) {
  const isAnInvitedUser = teamInviteToken !== undefined

  const linkToRegisterPage = isAnInvitedUser
    ? `/auth/invites/${teamInviteToken}/`
    : "/auth/register"

  return (
    <PageContainer>
      <PageTitle
        title={
          isAnInvitedUser ? (
            <span className="kb-content-disabled">
              You{"'"}ve been invited to join{" "}
              <span className="kb-content-brand">Zibaletter</span>.
            </span>
          ) : (
            "Welcome to a new world of Emailing."
          )
        }
        description={
          isAnInvitedUser
            ? "Sign up or login to join the Zibaletter workspace."
            : "Choose your preferred method to access powerful emailing tools."
        }
      />

      <Oauth2Methods page="login" />

      <AuthMethodsDivider>Or continue with</AuthMethodsDivider>

      <form className="flex flex-col w-full py-4">
        <div className="grid grid-cols-1 gap-4">
          <TextField.Root id="email" placeholder="Enter your work email address">
            <TextField.Label htmlFor="email">Email address</TextField.Label>
          </TextField.Root>

          <PasswordField />
        </div>

        <div className="flex justify-end">
          <Button asChild variant="tertiary" className="underline">
            <a href="/auth/passwords/forgot">Forgot your password ?</a>
          </Button>
        </div>

        <Button type="submit" width="full" className="mt-2">
          Continue
        </Button>
      </form>

      <div className="flex justify-center">
        <Text>
          Don{"'"}t have an account?
          <a className="ml-2 underline kb-content-info" href={linkToRegisterPage}>
            Create an account
          </a>
        </Text>
      </div>
    </PageContainer>
  )
}

export { LoginPage as Page }
