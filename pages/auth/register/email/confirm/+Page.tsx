import "./page.css"
import { PageContainer, PageTitle } from "@/components/auth/auth.jsx"
import { Button } from "@kibamail/owly/button"
import * as CodeInput from "@kibamail/owly/code-input"
import { Text } from "@kibamail/owly/text"
import React from "react"

function EmailConfirmPage() {
  return (
    <PageContainer>
      <div className="mb-10">
        <img src="/icons/email-send.svg" />
      </div>
      <PageTitle
        title="Enter the code sent to your email"
        description={
          <Text as="label" htmlFor="code">
            <span className="kb-content-tertiary">
              We have sent a code to your email address. Please enter the code below to
              confirm your email address
            </span>{" "}
            <span className="kb-content-primary">{"frantz@kibamail.com"}</span>.
          </Text>
        }
      />

      <div className="grid grid-cols-1 gap-y-10">
        <form className="flex flex-col w-full pt-6">
          <CodeInput.Input name="code" id="code" />
        </form>

        <Text>
          Didn{"'"}t receive mail? Check your spam folder or
          <Button variant="tertiary" className="kb-content-link underline pl-0 ml-1">
            Send again
          </Button>
        </Text>
      </div>
    </PageContainer>
  )
}

export { EmailConfirmPage as Page }
