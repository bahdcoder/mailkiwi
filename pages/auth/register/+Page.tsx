import {
  AuthMethodsDivider,
  Oauth2Methods,
  PageContainer,
  PageTitle,
} from "@/components/auth/auth.jsx"
import { Button } from "@kibamail/owly/button"
import { Text } from "@kibamail/owly/text"
import * as TextField from "@kibamail/owly/text-field"
import React from "react"

interface RegisterPageProps {
  teamInviteToken?: string
}

function RegisterPage({ teamInviteToken }: RegisterPageProps) {
  const isAnInvitedUser = teamInviteToken !== undefined

  const linkToLoginPage = isAnInvitedUser
    ? `/auth/invites/${teamInviteToken}/login`
    : "/auth/login"

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

      <Oauth2Methods page="register" />

      <AuthMethodsDivider>Or signup with</AuthMethodsDivider>

      <form className="flex flex-col w-full py-4">
        <div className="grid grid-cols-1 gap-4">
          <TextField.Root id="email" placeholder="Enter your work email address">
            <TextField.Label htmlFor="email">Email address</TextField.Label>
          </TextField.Root>
        </div>

        <Button type="submit" width="full" className="mt-2">
          Sign up
        </Button>
      </form>

      <div className="flex justify-center">
        <Text>
          Already have an account?
          <a className="ml-2 underline kb-content-info" href={linkToLoginPage}>
            Login
          </a>
        </Text>
      </div>
    </PageContainer>
  )
}

export { RegisterPage as Page }
