import { Button } from "@kibamail/owly/button"
import { Heading } from "@kibamail/owly/heading"
import { Text } from "@kibamail/owly/text"
import * as TextField from "@kibamail/owly/text-field"

function ForgotPasswordPage() {
  return (
    <div className="w-full max-w-[25rem] mx-auto mt-24">
      <Heading>Reset password</Heading>

      <Text className="kb-content-tertiary mt-2">
        Enter your email address. If an account exists, you{"'"}ll receive an email with a
        password reset link soon.
      </Text>

      <form action="" className="mt-10 flex flex-col">
        <TextField.Root
          id="email"
          type="email"
          placeholder="Enter your account email address"
        >
          <TextField.Label htmlFor="email">Email address</TextField.Label>
        </TextField.Root>

        <div className="grid grid-cols-1 gap-2 w-full mt-6">
          <Button type="submit" width={"full"}>
            Continue
          </Button>

          <Button variant="tertiary" width="full" asChild>
            <a href="/auth/login">Back to login</a>
          </Button>
        </div>
      </form>
    </div>
  )
}

export { ForgotPasswordPage as Page }
