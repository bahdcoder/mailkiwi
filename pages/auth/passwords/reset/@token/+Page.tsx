import { PasswordField } from "@/components/input/password-field.jsx"
import { Button } from "@kibamail/owly/button"
import { Heading } from "@kibamail/owly/heading"
import { Text } from "@kibamail/owly/text"
import * as TextField from "@kibamail/owly/text-field"

function ResetPasswordPage() {
  return (
    <div className="w-full max-w-[25rem] mx-auto mt-24">
      <Heading>Create a new password</Heading>

      <Text className="kb-content-tertiary mt-2">
        Create a new password to regain access to your account
      </Text>

      <form action="" className="mt-10 flex flex-col">
        <div className="grid grid-cols-1 gap-4">
          <TextField.Root
            id="email"
            type="email"
            placeholder="Enter your account email address"
          >
            <TextField.Label htmlFor="email">Email address</TextField.Label>
          </TextField.Root>

          <div className="relative">
            <PasswordField
              strengthIndicator
              id="new-password"
              placeholder="Choose a new password"
            >
              <TextField.Label htmlFor="new-password">New password</TextField.Label>
            </PasswordField>
          </div>

          <PasswordField placeholder="Confirm your password" id="confirm-password">
            <TextField.Label htmlFor="confirm-password">Confirm password</TextField.Label>
          </PasswordField>
        </div>

        <div className="grid grid-cols-1 gap-2 w-full mt-6">
          <Button type="submit" width={"full"}>
            Continue
          </Button>
        </div>
      </form>
    </div>
  )
}

export { ResetPasswordPage as Page }
