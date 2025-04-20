import { render } from '@testing-library/react'
import React from 'react'
import { describe, test } from 'vitest'
import { Button } from './button.jsx'

describe('@components/button', () => {
  test('should render', async ({ expect }) => {
    render(<Button />)
  })
})
