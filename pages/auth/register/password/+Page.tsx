import { PageContainer, PageTitle } from "@/components/auth/auth.jsx"
import { PasswordField } from "@/components/input/password-field.jsx"
import { Button } from "@kibamail/owly/button"
import { Text } from "@kibamail/owly/text"
import React from "react"

function RegisterPasswordPage() {
  return (
    <PageContainer>
      <PageTitle
        title="Create your password"
        description="Choose a secure password to enable access to your account."
      />

      <form className="flex flex-col w-full py-4 mt-10">
        <div className="grid grid-cols-1 gap-4 relative">
          <PasswordField placeholder="Create your password" strengthIndicator />
        </div>

        <Button type="submit" width="full" className="mt-6">
          Continue
        </Button>
      </form>
    </PageContainer>
  )
}

export { RegisterPasswordPage as Page }
