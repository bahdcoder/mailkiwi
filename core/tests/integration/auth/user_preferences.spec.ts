import { describe, test } from 'vitest'

import { UserRepository } from '#root/core/auth/users/repositories/user_repository.js'
import { makeRequestAsUser } from '#root/core/tests/utils/http.js'
import { createUser } from '#root/core/tests/mocks/auth/users.js'

import { container } from '#root/core/utils/typi.js'

describe('User Preferences API', () => {
  describe('PATCH /auth/preferences', () => {
    test('can update individual notification preferences', async ({ expect }) => {
      const { user } = await createUser()

      const response = await makeRequestAsUser(user, {
        method: 'PATCH',
        path: '/auth/preferences',
        body: {
          newContactNotifications: false,
        },
      })

      expect(response.status).toBe(200)

      const json = await response.json()
      expect(json.payload).toEqual({
        id: user.id,
      })

      // Verify the preference was updated in the database
      const updatedUser = await container.make(UserRepository).findById(user.id)
      expect(updatedUser?.newContactNotifications).toBe(false)
      // Other preferences should remain unchanged (default true)
      expect(updatedUser?.accountSummaryNotifications).toBe(true)
      expect(updatedUser?.changelogNewsletters).toBe(true)
    })

    test('can update multiple notification preferences at once', async ({ expect }) => {
      const { user } = await createUser()

      const response = await makeRequestAsUser(user, {
        method: 'PATCH',
        path: '/auth/preferences',
        body: {
          newContactNotifications: false,
          accountSummaryNotifications: false,
          changelogNewsletters: true,
        },
      })

      expect(response.status).toBe(200)

      const updatedUser = await container.make(UserRepository).findById(user.id)
      expect(updatedUser?.newContactNotifications).toBe(false)
      expect(updatedUser?.accountSummaryNotifications).toBe(false)
      expect(updatedUser?.changelogNewsletters).toBe(true)
    })

    test('validates boolean values for preferences', async ({ expect }) => {
      const { user } = await createUser()

      const response = await makeRequestAsUser(user, {
        method: 'PATCH',
        path: '/auth/preferences',
        body: {
          newContactNotifications: 'invalid',
        },
      })

      expect(response.status).toBe(422)
      const json = await response.json()
      expect(json.payload.errors).toBeDefined()
    })
  })
})
