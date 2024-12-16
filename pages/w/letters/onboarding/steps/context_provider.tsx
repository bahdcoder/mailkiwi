import { createContext } from "@radix-ui/react-context"

export const [OnboardingProvider, useOnboardingContext] = createContext<{
  step: number
  setStep: React.Dispatch<React.SetStateAction<number>>
}>("LettersOnboarding")
