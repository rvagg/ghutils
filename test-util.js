const http = require('http')
const EE = require('events').EventEmitter
const jsonist = require('jsonist')
const _jsonistget = jsonist.get
const _jsonistpost = jsonist.post

function makeServer (data) {
  const ee = new EE()
  let i = 0
  const server = http.createServer((req, res) => {
    ee.emit('request', req)

    const _data = Array.isArray(data) ? data[i++] : data

    if (_data && _data.headers && _data.headers.link) {
      res.setHeader('link', _data.headers.link)
    }

    res.end(JSON.stringify((_data && _data.response) || _data))

    if (!Array.isArray(data) || i === data.length) {
      server.close()
    }
  })

  server.listen(0, (err) => {
    if (err) {
      return ee.emit('error', err)
    }

    jsonist.get = (url, opts, callback) => {
      ee.emit('get', url, opts)
      return _jsonistget('http://localhost:' + server.address().port, opts, callback)
    }

    jsonist.post = (url, data, opts, callback) => {
      ee.emit('post', url, data, opts)
      return _jsonistpost('http://localhost:' + server.address().port, data, opts, callback)
    }

    ee.emit('ready')
  })

  server.on('close', ee.emit.bind(ee, 'close'))

  return ee
}

function toAuth (auth) {
  return `Basic ${Buffer.from(auth.user + ':' + auth.token).toString('base64')}`
}

function verifyRequest (t, auth) {
  return function (req) {
    t.ok(true, 'got request')
    t.equal(req.headers.authorization, toAuth(auth), 'got auth header')
  }
}

function verifyUrl (t, urls) {
  let i = 0
  return function (_url) {
    if (i === urls.length) {
      return t.fail('too many urls/requests')
    }
    t.equal(_url, urls[i++], 'correct url')
  }
}

function verifyClose (t) {
  return function () {
    t.ok(true, 'got close')
  }
}

function verifyData (t, data) {
  return function (err, _data) {
    t.notOk(err, 'no error')
    t.ok((data === '' && _data === '') || _data, 'got data')
    t.deepEqual(_data, data, 'got expected data')
  }
}

module.exports.makeServer = makeServer
module.exports.toAuth = toAuth
module.exports.verifyRequest = verifyRequest
module.exports.verifyUrl = verifyUrl
module.exports.verifyClose = verifyClose
module.exports.verifyData = verifyData
