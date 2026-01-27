import { test } from 'node:test'
import assert from 'node:assert'
import { createMockServer, createMockServerWithHandler } from './test-util.js'
import { ghget, ghpost, lister } from './ghutils.js'

test('ghget makes authenticated request', async () => {
  const auth = { token: 'test-token' }
  const responseData = { foo: 'bar' }

  const server = await createMockServer({ response: responseData })
  try {
    const { data } = await ghget(auth, server.baseUrl)

    assert.deepStrictEqual(data, responseData)
    assert.strictEqual(server.requests.length, 1)
    assert.strictEqual(server.requests[0].headers.authorization, 'Bearer test-token')
    assert.strictEqual(server.requests[0].headers.accept, 'application/vnd.github+json')
  } finally {
    await server.close()
  }
})

test('ghpost sends JSON data', async () => {
  const auth = { token: 'test-token' }
  const postData = { title: 'Test Issue' }
  const responseData = { id: 123, title: 'Test Issue' }

  const server = await createMockServer({ response: responseData })
  try {
    const { data } = await ghpost(auth, server.baseUrl, postData)

    assert.deepStrictEqual(data, responseData)
    assert.strictEqual(server.requests[0].method, 'POST')
    assert.deepStrictEqual(server.requests[0].body, postData)
    assert.strictEqual(server.requests[0].headers['content-type'], 'application/json')
  } finally {
    await server.close()
  }
})

test('lister follows pagination links', async () => {
  const auth = { token: 'test-token' }
  const page1 = [{ id: 1 }, { id: 2 }]
  const page2 = [{ id: 3 }, { id: 4 }]

  // Create server that dynamically sets link header based on request
  let requestCount = 0
  const mock = await createMockServerWithHandler((req, res) => {
    requestCount++
    const port = mock.address().port
    if (requestCount === 1) {
      res.setHeader('link', `<http://127.0.0.1:${port}/page2>; rel="next"`)
      res.end(JSON.stringify(page1))
    } else {
      res.end(JSON.stringify(page2))
    }
  })

  try {
    const results = await lister(auth, mock.baseUrl)
    assert.deepStrictEqual(results, [...page1, ...page2])
    assert.strictEqual(requestCount, 2)
  } finally {
    await mock.close()
  }
})

test('lister handles empty response', async () => {
  const auth = { token: 'test-token' }

  const server = await createMockServer({ response: [] })
  try {
    const results = await lister(auth, server.baseUrl)

    assert.deepStrictEqual(results, [])
  } finally {
    await server.close()
  }
})

test('lister respects afterDate option', async () => {
  const auth = { token: 'test-token' }
  const page1 = [
    { id: 1, created_at: '2024-01-15T00:00:00Z' },
    { id: 2, created_at: '2024-01-14T00:00:00Z' }
  ]
  const page2 = [
    { id: 3, created_at: '2024-01-13T00:00:00Z' },
    { id: 4, created_at: '2024-01-10T00:00:00Z' }
  ]

  let requestCount = 0
  const mock = await createMockServerWithHandler((req, res) => {
    requestCount++
    const port = mock.address().port
    if (requestCount === 1) {
      res.setHeader('link', `<http://127.0.0.1:${port}/page2>; rel="next"`)
      res.end(JSON.stringify(page1))
    } else {
      res.end(JSON.stringify(page2))
    }
  })

  try {
    const afterDate = new Date('2024-01-12T00:00:00Z')
    const results = await lister(auth, mock.baseUrl, { afterDate })

    // Should only include items after 2024-01-12
    assert.strictEqual(results.length, 3)
    assert.deepStrictEqual(results.map(r => r.id), [1, 2, 3])
  } finally {
    await mock.close()
  }
})

test('ghget throws on error response with message', async () => {
  const auth = { token: 'test-token' }
  const errorData = { message: 'Not Found' }

  const server = await createMockServer({ response: errorData, statusCode: 404 })
  try {
    await assert.rejects(
      ghget(auth, server.baseUrl),
      (err) => {
        assert.strictEqual(err.message, 'Error from GitHub: Not Found')
        return true
      }
    )
  } finally {
    await server.close()
  }
})

test('ghget throws on error response with errors array', async () => {
  const auth = { token: 'test-token' }
  const errorData = {
    message: 'Validation Failed',
    errors: [{ field: 'title', code: 'missing' }]
  }

  const server = await createMockServer({ response: errorData, statusCode: 422 })
  try {
    await assert.rejects(
      ghget(auth, server.baseUrl),
      (err) => {
        assert.ok(err.message.includes('Validation Failed'))
        assert.ok(err.message.includes('missing'))
        return true
      }
    )
  } finally {
    await server.close()
  }
})

test('ghget supports legacy {user, token} auth format', async () => {
  const auth = { user: 'testuser', token: 'test-token' }
  const responseData = { success: true }

  const server = await createMockServer({ response: responseData })
  try {
    const { data } = await ghget(auth, server.baseUrl)

    assert.deepStrictEqual(data, responseData)
    // Should still use Bearer token (user is ignored in modern auth)
    assert.strictEqual(server.requests[0].headers.authorization, 'Bearer test-token')
  } finally {
    await server.close()
  }
})

test('lister passes query options to URL', async () => {
  const auth = { token: 'test-token' }

  const server = await createMockServer({ response: [] })
  try {
    await lister(auth, server.baseUrl, { state: 'open', per_page: 100 })

    assert.strictEqual(server.requests.length, 1)
    const requestUrl = server.requests[0].url
    assert.ok(requestUrl.includes('state=open'), 'should include state param')
    assert.ok(requestUrl.includes('per_page=100'), 'should include per_page param')
  } finally {
    await server.close()
  }
})
