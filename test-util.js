import http from 'node:http'
import { EventEmitter } from 'node:events'

/**
 * Create a mock GitHub API server for testing
 * @param {Array|Object} testData - Response data (array for multiple requests)
 * @returns {Object} Server info with url and close method
 */
export async function createMockServer (testData) {
  const requests = []
  let requestIndex = 0
  const dataArray = Array.isArray(testData) ? testData : [testData]
  let baseUrl = ''

  const server = http.createServer((req, res) => {
    let body = ''
    req.on('data', chunk => { body += chunk })
    req.on('end', () => {
      const requestInfo = {
        method: req.method,
        url: req.url,
        headers: req.headers,
        body: body ? JSON.parse(body) : null
      }
      requests.push(requestInfo)

      const responseData = dataArray[requestIndex++]
      const statusCode = responseData?.statusCode || 200
      const headers = { 'content-type': 'application/json', ...responseData?.headers }

      // Replace {{baseUrl}} placeholder in link headers
      if (headers.link) {
        headers.link = headers.link.replace(/\{\{baseUrl\}\}/g, baseUrl)
      }

      res.writeHead(statusCode, headers)
      res.end(JSON.stringify(responseData?.response ?? responseData ?? []))
    })
  })

  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve))

  const { port } = server.address()
  baseUrl = `http://127.0.0.1:${port}`

  return {
    baseUrl,
    requests,
    server,
    close: () => new Promise((resolve) => server.close(resolve))
  }
}

/**
 * Create a mock server with custom request handler
 */
export async function createMockServerWithHandler (handler) {
  const server = http.createServer((req, res) => {
    res.setHeader('content-type', 'application/json')
    handler(req, res, server)
  })

  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve))

  const { port } = server.address()
  const baseUrl = `http://127.0.0.1:${port}`

  const originalClose = server.close.bind(server)

  return {
    baseUrl,
    server,
    address: () => server.address(),
    close: () => new Promise((resolve) => originalClose(resolve))
  }
}

/**
 * Legacy test utilities for backwards compatibility
 * These work with the old event-based test pattern
 */
export function makeServer (data) {
  const ee = new EventEmitter()

  ;(async () => {
    const { baseUrl, close } = await createMockServer(data)
    ee.baseUrl = baseUrl
    ee.close = close
    ee.emit('ready', baseUrl)
  })()

  return ee
}

export function toAuth (auth) {
  return `Bearer ${auth.token}`
}

export function verifyRequest (t, auth) {
  return function (req) {
    t.assert.ok(true, 'got request')
    t.assert.strictEqual(req.headers.authorization, toAuth(auth), 'got auth header')
  }
}

export function verifyUrl (t, urls) {
  let i = 0
  return function (url) {
    if (i >= urls.length) {
      t.assert.fail('too many urls/requests')
      return
    }
    t.assert.strictEqual(url, urls[i++], 'correct url')
  }
}

export function verifyClose (t) {
  return function () {
    t.assert.ok(true, 'got close')
  }
}

export function verifyData (t, expectedData) {
  return function (err, data) {
    t.assert.ifError(err)
    t.assert.ok(data !== undefined, 'got data')
    t.assert.deepStrictEqual(data, expectedData, 'got expected data')
  }
}
