const test = require('tape')
const xtend = require('xtend')
const util = require('./test-util')
const ghutils = require('./')

test('that lister follows res.headers.link', (t) => {
  t.plan(13)

  const auth = { user: 'authuser', token: 'authtoken' }
  const testData = [
    {
      response: [{ test3: 'data3' }, { test4: 'data4' }],
      headers: { link: '<https://somenexturl>; rel="next"' }
    },
    {
      response: [{ test5: 'data5' }, { test6: 'data6' }],
      headers: { link: '<https://somenexturl2>; rel="next"' }
    },
    []
  ]
  const urlBase = 'https://api.github.com/foobar'

  util.makeServer(testData)
    .on('ready', () => {
      const result = testData[0].response.concat(testData[1].response)
      ghutils.lister(xtend(auth), urlBase, {}, util.verifyData(t, result))
    })
    .on('request', util.verifyRequest(t, auth))
    .on('get', util.verifyUrl(t, [
      'https://api.github.com/foobar',
      'https://somenexturl',
      'https://somenexturl2'
    ]))
    .on('close', util.verifyClose(t))
})

test('test list multi-page pulls, options.afterDate includes all', (t) => {
  t.plan(13)

  const auth = { user: 'authuser', token: 'authtoken' }
  const testData = [
    {
      response: [{ test1: 'data1', created_at: new Date('2015-12-14T05:58:14.421Z').toISOString() }, { test2: 'data2', created_at: new Date('2015-12-13T05:58:14.421Z').toISOString() }],
      headers: { link: '<https://api.github.com/foobar?page=2>; rel="next"' }
    },
    {
      response: [{ test1: 'data3', created_at: new Date('2015-12-12T05:58:14.421Z').toISOString() }, { test2: 'data4', created_at: new Date('2015-12-11T05:58:14.421Z').toISOString() }],
      headers: { link: '<https://api.github.com/foobar?page=1>; rel="prev", <https://api.github.com/foobar?page=3>; rel="next", <https://api.github.com/foobar?page=4>; rel="last", <https://api.github.com/foobar?page=1>; rel="first"' }
    },
    { response: [] }
  ]
  const urlBase = 'https://api.github.com/foobar'

  util.makeServer(testData)
    .on('ready', () => {
      const result = testData[0].response.concat(testData[1].response)
      ghutils.lister(xtend(auth), urlBase, { afterDate: new Date('2015-12-10T05:58:14.421Z') }, util.verifyData(t, result))
    })
    .on('request', util.verifyRequest(t, auth))
    .on('get', util.verifyUrl(t, [
      'https://api.github.com/foobar',
      'https://api.github.com/foobar?page=2',
      'https://api.github.com/foobar?page=3'
    ]))
    .on('close', util.verifyClose(t))
})

test('test list multi-page pulls, options.afterDate includes all', (t) => {
  t.plan(10)

  const auth = { user: 'authuser', token: 'authtoken' }
  const testData = [
    {
      response: [{ test1: 'data1', created_at: new Date('2015-12-14T05:58:14.421Z').toISOString() }, { test2: 'data2', created_at: new Date('2015-12-13T05:58:14.421Z').toISOString() }],
      headers: { link: '<https://api.github.com/foobar?page=2>; rel="next"' }
    },
    {
      response: [{ test1: 'data3', created_at: new Date('2015-12-12T05:58:14.421Z').toISOString() }, { test2: 'data4', created_at: new Date('2015-12-11T05:58:14.421Z').toISOString() }],
      headers: { link: '<https://api.github.com/foobar?page=3>; rel="next"' }
    }
    // also tests that we don't fetch any more beyond this point, i.e. only 2 requests needed
  ]
  const urlBase = 'https://api.github.com/foobar'

  util.makeServer(testData)
    .on('ready', () => {
      const result = testData[0].response.concat([testData[1].response[0]])
      ghutils.lister(xtend(auth), urlBase, { afterDate: new Date('2015-12-11T15:58:14.421Z') }, util.verifyData(t, result))
    })
    .on('request', util.verifyRequest(t, auth))
    .on('get', util.verifyUrl(t, [
      'https://api.github.com/foobar',
      'https://api.github.com/foobar?page=2'
    ]))
    .on('close', util.verifyClose(t))
})

test('valid response with null data calls back with null data', (t) => {
  t.plan(5)

  const auth = { user: 'authuser', token: 'authtoken' }
  const testData = null
  const urlBase = 'https://api.github.com/foobar'

  util.makeServer(testData)
    .on('ready', () => {
      ghutils.ghget(xtend(auth), urlBase, {}, (err, data) => {
        t.notOk(err, 'no error')
        t.deepEqual(data, testData, 'got expected data')
      })
    })
    .on('request', util.verifyRequest(t, auth))
    .on('close', util.verifyClose(t))
})

test('data.message calls back with error', (t) => {
  t.plan(4)

  const auth = { user: 'authuser', token: 'authtoken' }
  const testData = { message: 'borked borked' }
  const urlBase = 'https://api.github.com/foobar'

  util.makeServer(testData)
    .on('ready', () => {
      ghutils.ghget(xtend(auth), urlBase, {}, (err, data) => {
        t.is(err.message, 'Error from GitHub: borked borked')
      })
    })
    .on('request', util.verifyRequest(t, auth))
    .on('close', util.verifyClose(t))
})

test('data.message calls back with error + extra', (t) => {
  t.plan(4)

  const auth = { user: 'authuser', token: 'authtoken' }
  const testData = {
    message: 'borked borked',
    errors: [{ foo: 'bar' }]
  }
  const urlBase = 'https://api.github.com/foobar'

  util.makeServer(testData)
    .on('ready', () => {
      ghutils.ghget(xtend(auth), urlBase, {}, (err, data) => {
        t.is(err.message, 'Error from GitHub: borked borked ([{"foo":"bar"}])')
      })
    })
    .on('request', util.verifyRequest(t, auth))
    .on('close', util.verifyClose(t))
})

test('data.error calls back with error', (t) => {
  t.plan(4)

  const auth = { user: 'authuser', token: 'authtoken' }
  const testData = { error: 'borked borked' }
  const urlBase = 'https://api.github.com/foobar'

  util.makeServer(testData)
    .on('ready', () => {
      ghutils.ghget(xtend(auth), urlBase, {}, (err, data) => {
        t.is(err.message, 'Error from GitHub: borked borked')
      })
    })
    .on('request', util.verifyRequest(t, auth))
    .on('close', util.verifyClose(t))
})

test('data.error calls back with error + extra', (t) => {
  t.plan(4)

  const auth = { user: 'authuser', token: 'authtoken' }
  const testData = {
    message: 'borked borked',
    errors: [{ foo: 'bar' }]
  }
  const urlBase = 'https://api.github.com/foobar'

  util.makeServer(testData)
    .on('ready', () => {
      ghutils.ghget(xtend(auth), urlBase, {}, (err, data) => {
        t.is(err.message, 'Error from GitHub: borked borked ([{"foo":"bar"}])')
      })
    })
    .on('request', util.verifyRequest(t, auth))
    .on('close', util.verifyClose(t))
})
