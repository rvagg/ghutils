const jsonist = require('jsonist')
const qs = require('querystring')

const apiRoot = 'https://api.github.com'

function makeOptions (auth, options) {
  const headers = Object.assign(
    { 'user-agent': 'Magic Node.js application that does magic things' },
    typeof options === 'object' && typeof options.headers === 'object' ? options.headers : {}
  )
  options = Object.assign({ auth: `${auth.user}:${auth.token}` }, options)
  options.headers = headers
  if (!options.auth) {
    delete options.auth
  }
  return options
}

function handler (callback) {
  return function responseHandler (err, data, res) {
    if (err) {
      return callback(err)
    }

    if (data && (data.error || data.message)) {
      return callback(createError(data))
    }

    callback(null, data, res)
  }
}

function createError (data) {
  const message = data.error || data.message
  const extra = data.errors ? ` (${JSON.stringify(data.errors)})` : ''
  return new Error(`Error from GitHub: ${message}${extra}`)
}

function ghget (auth, url, options, callback) {
  options = makeOptions(auth, options)
  jsonist.get(url, Object.assign(options, { followRedirects: true }), handler(callback))
}

function ghpost (auth, url, data, options, callback) {
  options = makeOptions(auth, options)
  jsonist.post(url, data, options, handler(callback))
}

function lister (auth, urlbase, options, callback) {
  let retdata = []
  const afterDate = (options.afterDate instanceof Date) && options.afterDate

  // overloading use of 'options' is ... not great
  const optqsobj = Object.assign(options)
  delete optqsobj.afterDate
  delete optqsobj.headers
  const optqs = qs.stringify(optqsobj)

  ;(function next (url) {
    if (optqs) {
      url += '&' + optqs
    }

    ghget(auth, url, options, (err, data, res) => {
      if (err) {
        return callback(err)
      }

      if (data.length) {
        retdata.push.apply(retdata, data)
      }

      const nextUrl = getNextUrl(res.headers.link)
      let createdAt

      if (nextUrl) {
        if (!afterDate || ((createdAt = retdata[retdata.length - 1].created_at) && new Date(createdAt) > afterDate)) {
          return next(nextUrl)
        }
      }

      if (afterDate) {
        retdata = retdata.filter((data) => {
          return !data.created_at || new Date(data.created_at) > afterDate
        })
      }
      callback(null, retdata)
    })
  }(urlbase))

  function getNextUrl (link) {
    if (typeof link === 'undefined') {
      return
    }
    const match = /<([^>]+)>; rel="next"/.exec(link)
    return match && match[1]
  }
}

module.exports.makeOptions = makeOptions
module.exports.ghpost = ghpost
module.exports.ghget = ghget
module.exports.handler = handler
module.exports.lister = lister
module.exports.apiRoot = apiRoot
