import { createContext } from "@radix-ui/react-context"

export type FormState = {
  audienceId: string
}
export const [OnboardingProvider, useOnboardingContext] = createContext<{
  step: number
  setStep: React.Dispatch<React.SetStateAction<number>>

  formState: FormState
  setFormState: React.Dispatch<React.SetStateAction<FormState>>
}>("LettersOnboarding")
