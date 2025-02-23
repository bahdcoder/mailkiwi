import type { ProgressProps } from '@kibamail/owly/progress'
import React from 'react'

const rules = [
  {
    regex: /(?=.*[A-Z])/,
    message: 'Must contain at least one uppercase letter',
  },
  {
    regex: /(?=.*[0-9])/,
    message: 'Must contain at least one number',
  },
  {
    regex: /(?=.*[!@#$%^&*])/,
    message: 'Must contain at least one special character',
  },
  {
    regex: /(?=.{8,})/,
    message: 'Must be at least 8 characters long',
  },
]

export function usePasswordStrengthIndicator(enabled?: boolean) {
  const [validationRulesResults, setValidationRulesResults] = React.useState<
    [boolean, boolean, boolean, boolean]
  >([false, false, false, false])

  function onChange(value: string) {
    if (!enabled) {
      return
    }
    const results: [boolean, boolean, boolean, boolean] = [false, false, false, false]

    for (const [index, rule] of rules.entries()) {
      const result = rule.regex.test(value)

      if (result) {
        results[index] = true
      }
    }

    setValidationRulesResults(results)
  }

  const percentage = React.useMemo(() => {
    const passedRules = validationRulesResults.filter(Boolean).length

    return (passedRules / rules.length) * 100
  }, [validationRulesResults])

  const variant: ProgressProps['variant'] = React.useMemo(() => {
    if (percentage < 50) {
      return 'error'
    }

    if (percentage < 75) {
      return 'warning'
    }

    if (percentage >= 50) {
      return 'success'
    }
  }, [percentage])

  return {
    onChange,
    validationRulesResults,
    rules,
    indicator: { percentage, variant },
  }
}
