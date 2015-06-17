const jsonist = require('jsonist')
    , xtend   = require('xtend')
    , qs      = require('querystring')

    , apiRoot = 'https://api.github.com'


function makeOptions (auth, options) {
  return xtend({
      headers : { 'User-Agent' : 'Magic Node.js application that does magic things' }
    , auth    : auth.user + ':' + auth.token
  }, options)
}


function handler (callback) {
  return function responseHandler (err, data) {
    if (err)
      return callback(err)

    if (data.error || data.message)
      return callback(new Error('Error from GitHub: ' + (data.error || data.message)))

    callback(null, data)
  }
}


function ghget (auth, url, options, callback) {
  options = makeOptions(auth, options)

  jsonist.get(url, options, handler(callback))
}


function ghpost (auth, url, data, options, callback) {
  options = makeOptions(auth, options)

  jsonist.post(url, data, options, handler(callback))
}


function issuesList (type) {
  return function list (auth, org, repo, options, callback) {
    if (typeof options == 'function') {
      callback = options
      options  = {}
    }

    var url = apiRoot + '/repos/' + org + '/' + repo + '/' + type
    lister(auth, url, options, callback)
  }
}


function lister (auth, urlbase, options, callback) {
  var retdata = []
    , optqs  = qs.stringify(options)

  if (optqs)
    optqs = '&' + optqs

  //TODO: use 'Link' headers to improve the guesswork here
  ;(function next (page) {
    var url = urlbase + '?page=' + page + optqs

    ghget(auth, url, options, function (err, data) {
      if (err)
        return callback(err)

      if (!data.length)
        return callback(null, retdata)

      retdata.push.apply(retdata, data)

      next(page + 1)
    })
  }(1))
}


module.exports.makeOptions = makeOptions
module.exports.ghpost      = ghpost
module.exports.ghget       = ghget
module.exports.handler     = handler
module.exports.issuesList  = issuesList
module.exports.lister      = lister
module.exports.apiRoot     = apiRoot
