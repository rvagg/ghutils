const apiRoot = 'https://api.github.com'

/**
 * Build request options with auth headers
 * Supports both legacy {user, token} and modern {token} auth formats
 */
function makeOptions (auth, options = {}) {
  const headers = {
    'user-agent': 'Magic Node.js application that does magic things',
    accept: 'application/vnd.github+json',
    ...options.headers
  }

  // Support both {token} (modern) and {user, token} (legacy) auth formats
  if (auth?.token) {
    headers.authorization = `Bearer ${auth.token}`
  }

  return { ...options, headers }
}

function createError (data) {
  const message = data.error || data.message
  const extra = data.errors ? ` (${JSON.stringify(data.errors)})` : ''
  const err = new Error(`Error from GitHub: ${message}${extra}`)
  err.data = data
  return err
}

async function handleResponse (res) {
  const data = res.status === 204 ? null : await res.json()

  if (!res.ok || (data && (data.error || data.message))) {
    throw createError(data || { message: res.statusText })
  }

  return { data, res }
}

async function ghget (auth, url, options = {}) {
  const opts = makeOptions(auth, options)
  const res = await fetch(url, {
    method: 'GET',
    headers: opts.headers,
    redirect: 'follow'
  })
  return handleResponse(res)
}

async function ghpost (auth, url, data, options = {}) {
  const opts = makeOptions(auth, options)
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      ...opts.headers
    },
    body: JSON.stringify(data)
  })
  return handleResponse(res)
}

async function ghpatch (auth, url, data, options = {}) {
  const opts = makeOptions(auth, options)
  const res = await fetch(url, {
    method: 'PATCH',
    headers: {
      'content-type': 'application/json',
      ...opts.headers
    },
    body: JSON.stringify(data)
  })
  return handleResponse(res)
}

async function ghdelete (auth, url, options = {}) {
  const opts = makeOptions(auth, options)
  const res = await fetch(url, {
    method: 'DELETE',
    headers: opts.headers
  })
  return handleResponse(res)
}

function getNextUrl (linkHeader) {
  if (!linkHeader) return null
  const match = /<([^>]+)>;\s*rel="next"/.exec(linkHeader)
  return match?.[1] || null
}

async function lister (auth, urlBase, options = {}) {
  let results = []
  const afterDate = options.afterDate instanceof Date ? options.afterDate : null

  // Build query string from options (excluding special options)
  const queryParams = new URLSearchParams()
  for (const [key, value] of Object.entries(options)) {
    if (key !== 'afterDate' && key !== 'headers' && value !== undefined) {
      queryParams.set(key, value)
    }
  }
  const queryString = queryParams.toString()

  let url = urlBase
  if (queryString) {
    url += (url.includes('?') ? '&' : '?') + queryString
  }

  while (url) {
    const { data, res } = await ghget(auth, url, options)

    if (Array.isArray(data) && data.length > 0) {
      results = results.concat(data)
    }

    const nextUrl = getNextUrl(res.headers.get('link'))

    if (nextUrl && afterDate) {
      const lastItem = results[results.length - 1]
      const createdAt = lastItem?.created_at
      if (createdAt && new Date(createdAt) <= afterDate) {
        break
      }
    }

    url = nextUrl
  }

  if (afterDate) {
    results = results.filter((item) => {
      return !item.created_at || new Date(item.created_at) > afterDate
    })
  }

  return results
}

export {
  apiRoot,
  makeOptions,
  ghget,
  ghpost,
  ghpatch,
  ghdelete,
  lister
}
