const test    = require('tape')
    , xtend   = require('xtend')
    , util    = require('./test-util')
    , ghutils = require('./')


test('that lister follows res.headers.link', function (t) {
  t.plan(13)

  var auth     = { user: 'authuser', token: 'authtoken' }
    , org      = 'testorg'
    , testData = [
          {
              response : [ { test3: 'data3' }, { test4: 'data4' } ]
            , headers  : { link: '<https://somenexturl>; rel="next"' }
          }
        , {
              response : [ { test5: 'data5' }, { test6: 'data6' } ]
            , headers  : { link: '<https://somenexturl2>; rel="next"' }
          }
        , []
      ]
    , urlBase  = 'https://api.github.com/foobar'
    , server

  server = util.makeServer(testData)
    .on('ready', function () {
      var result = testData[0].response.concat(testData[1].response)
      ghutils.lister(xtend(auth), urlBase, {}, util.verifyData(t, result))
    })
    .on('request', util.verifyRequest(t, auth))
    .on('get', util.verifyUrl(t, [
        'https://api.github.com/foobar'
      , 'https://somenexturl'
      , 'https://somenexturl2'
    ]))
    .on('close'  , util.verifyClose(t))

})

test('valid response with null data calls back with null data', function (t) {
  t.plan(5)

  var auth     = { user: 'authuser', token: 'authtoken' }
    , org      = 'testorg'
    , testData = null
    , urlBase  = 'https://api.github.com/foobar'
    , server

  server = util.makeServer(testData)
    .on('ready', function () {
      ghutils.ghget(xtend(auth), urlBase, {}, function (err, data) {
        t.notOk(err, 'no error')
        t.deepEqual(data, testData, 'got expected data')
      })
    })
    .on('request', util.verifyRequest(t, auth))
    .on('close'  , util.verifyClose(t))

})

test('data.message calls back with error', function (t) {
  t.plan(4)

  var auth     = { user: 'authuser', token: 'authtoken' }
    , org      = 'testorg'
    , testData = { message: 'borked borked' }
    , urlBase  = 'https://api.github.com/foobar'
    , server

  server = util.makeServer(testData)
    .on('ready', function () {
      ghutils.ghget(xtend(auth), urlBase, {}, function (err, data) {
        t.deepEqual(err, new Error('Error from GitHub: borked borked'))
      })
    })
    .on('request', util.verifyRequest(t, auth))
    .on('close'  , util.verifyClose(t))

})

test('data.error calls back with error', function (t) {
  t.plan(4)

  var auth     = { user: 'authuser', token: 'authtoken' }
    , org      = 'testorg'
    , testData = { error: 'borked borked' }
    , urlBase  = 'https://api.github.com/foobar'
    , server

  server = util.makeServer(testData)
    .on('ready', function () {
      ghutils.ghget(xtend(auth), urlBase, {}, function (err, data) {
        t.deepEqual(err, new Error('Error from GitHub: borked borked'))
      })
    })
    .on('request', util.verifyRequest(t, auth))
    .on('close'  , util.verifyClose(t))

})
