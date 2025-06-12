import { describe, test } from 'vitest'

import { createUser } from '#root/core/tests/mocks/auth/users.js'
import { makeRequestAsUser } from '#root/core/tests/utils/http.js'

describe('@auth API Token Generation', () => {
  test('can generate an api token for api and smtp access', async ({ expect }) => {
    const { user } = await createUser()

    const response = await makeRequestAsUser(user, {
      method: 'POST',
      path: '/auth/api-keys',
      body: {
        name: 'My API Key',
        capabilities: 'full',
      },
    })

    const json = await response.json()

    expect(response.status).toBe(200)
    expect(json.payload).toEqual({
      apiKey: expect.any(String),
    })
    expect(json.payload.apiKey).toContain('kbt_')
    expect(json.payload.apiKey).toHaveLength(48)
  })

  test('can delete an api key', async ({ expect }) => {
    const { user } = await createUser()

    const createResponse = await makeRequestAsUser(user, {
      method: 'POST',
      path: '/auth/api-keys',
      body: {
        name: 'Test API Key',
        capabilities: 'full',
      },
    })

    expect(createResponse.status).toBe(200)

    const listResponse = await makeRequestAsUser(user, {
      method: 'GET',
      path: '/auth/api-keys',
    })

    const listJson = await listResponse.json()
    expect(listResponse.status).toBe(200)
    expect(listJson.payload.apiKeys).toHaveLength(1)

    const apiKeyId = listJson.payload.apiKeys[0].id

    const deleteResponse = await makeRequestAsUser(user, {
      method: 'DELETE',
      path: `/auth/api-keys/${apiKeyId}`,
    })

    const deleteJson = await deleteResponse.json()
    expect(deleteResponse.status).toBe(200)
    expect(deleteJson.payload).toEqual({
      id: apiKeyId,
    })

    const verifyResponse = await makeRequestAsUser(user, {
      method: 'GET',
      path: '/auth/api-keys',
    })

    const verifyJson = await verifyResponse.json()
    expect(verifyResponse.status).toBe(200)
    expect(verifyJson.payload.apiKeys).toHaveLength(0)
  })

  test('cannot delete an api key that does not exist', async ({ expect }) => {
    const { user } = await createUser()

    const response = await makeRequestAsUser(user, {
      method: 'DELETE',
      path: '/auth/api-keys/non-existent-id',
    })

    expect(response.status).toBe(422)
    const json = await response.json()
    expect(json.payload.errors[0].message).toBe('API key not found.')
  })

  test('cannot delete an api key from another team', async ({ expect }) => {
    const { user: user1 } = await createUser()
    const { user: user2 } = await createUser()

    const createResponse = await makeRequestAsUser(user1, {
      method: 'POST',
      path: '/auth/api-keys',
      body: {
        name: 'Test API Key',
        capabilities: 'full',
      },
    })

    expect(createResponse.status).toBe(200)

    const listResponse = await makeRequestAsUser(user1, {
      method: 'GET',
      path: '/auth/api-keys',
    })

    const listJson = await listResponse.json()
    const apiKeyId = listJson.payload.apiKeys[0].id

    const deleteResponse = await makeRequestAsUser(user2, {
      method: 'DELETE',
      path: `/auth/api-keys/${apiKeyId}`,
    })

    expect(deleteResponse.status).toBe(401)
  })
})
