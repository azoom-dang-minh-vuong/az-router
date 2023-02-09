import path from 'path'
import util from 'util'
import EventEmitter from 'events'
import assert from 'assert'
import chalk from 'chalk'
import { createRequest, createResponse } from 'node-mocks-http'
import azRouter, { AzRouter } from '../src/index'
import {
  permissionId,
  sampleParamGetBooks,
  sampleParamTraceBooks1,
  sampleParamTraceBooks2,
  userId,
} from './data.mocks'

const routeDir = path.relative(process.cwd(), path.join(__dirname, 'routes'))
const router = azRouter({
  routeDir,
  debug: true,
})
const layerMiddleware = router.stack[router.stack.length - 1]

const createResponseOf = (req: ReturnType<typeof createRequest>) =>
  createResponse({
    req,
    eventEmitter: EventEmitter,
  })

const waitResponse = (
  req: ReturnType<typeof createRequest>,
  res: ReturnType<typeof createResponse>,
  r: AzRouter = router
) =>
  new Promise((resolve, reject) => {
    res.once('end', resolve)
    res.once('error', reject)
    r(req, res, reject)
  })

const testGetBookCount = async function () {
  const req = createRequest({
    method: 'GET',
    url: '/books/count',
  })
  const res = createResponseOf(req)
  await waitResponse(req, res)
  assert.strictEqual(res._getData(), 'Counting books')
}
const testMiddlewareOfBookId = async function () {
  const req = createRequest({
    method: 'GET',
    url: '/books/1',
    params: { bookId: 1 },
  })
  const res = createResponseOf(req)
  await waitResponse(req, res)
  assert.strictEqual(req.userId, userId)
  assert.strictEqual(req.permissionId, permissionId)
  const req2 = createRequest({
    method: 'GET',
    url: '/books/1/authors/2',
    params: { bookId: 1, authorId: 2 },
  })
  const res2 = createResponseOf(req2)
  await waitResponse(req2, res2)
  assert.strictEqual(req2.userId, userId)
  assert.strictEqual(req2.permissionId, permissionId)
}

describe(`Test ${chalk.yellowBright('middlewareWaitingForInit')}`, function () {
  this.timeout(5000)
  function sendRequests() {
    return Promise.all([testGetBookCount.call(this), testMiddlewareOfBookId.call(this)])
  }
  it('Send 2 requests before router have been initialized', function (done) {
    assert.strictEqual(util.inspect(router.promise()), 'Promise { <pending> }')
    sendRequests
      .call(this)
      .then(() => done())
      .catch(done)
  })
  it('Send 2 requests after router have been initialized', async function () {
    await router.promise()
    await sendRequests.call(this)
  })
  it(`Remove layer of ${chalk.yellowBright('middlewareWaitingForInit')} from ${chalk.blueBright(
    'router'
  )}.${chalk.cyanBright('stack')}`, async function () {
    await router.promise()
    assert.strictEqual(router.stack.indexOf(layerMiddleware), -1)
  })
})

describe('Test Request Response', function () {
  this.timeout(2000)
  it('GET /', async function () {
    const req = createRequest({
      method: 'GET',
      url: '/',
    })
    const res = createResponseOf(req)
    await waitResponse(req, res)
    assert.strictEqual(res._getData(), 'Get root')
  })
  it('GET /:id', async function () {
    const req = createRequest({
      method: 'GET',
      url: '/1',
      params: { id: 1 },
    })
    const res = createResponseOf(req)
    await waitResponse(req, res)
    assert.strictEqual(res._getData(), 'Get root id: 1')
  })
  it('GET /books', async function () {
    const req = createRequest({
      method: 'GET',
      url: '/books',
    })
    const res = createResponseOf(req)
    await waitResponse(req, res)
    assert.strictEqual(res._getData(), 'Get books')
  })
  it('TRACE /books', async function () {
    const req = createRequest({
      method: 'TRACE',
      url: '/books',
    })
    const res = createResponseOf(req)
    await waitResponse(req, res)
    assert.strictEqual(res._getData(), 'Tracing books')
  })
  it('Passing middleware function of method GET /books', async function () {
    const req = createRequest({
      method: 'GET',
      url: '/books',
    })
    const res = createResponseOf(req)
    await waitResponse(req, res)
    assert.strictEqual(req.sampleParam, sampleParamGetBooks)
  })
  it('Passing array of middleware of method TRACE /books', async function () {
    const req = createRequest({
      method: 'TRACE',
      url: '/books',
    })
    const res = createResponseOf(req)
    await waitResponse(req, res)
    assert.strictEqual(req.sampleParam, sampleParamTraceBooks1 + sampleParamTraceBooks2)
  })
  it('GET /books/count', testGetBookCount)
  it('Passing middleware for route /books/:bookId', testMiddlewareOfBookId)
  it('HEAD /books/:bookId', async function () {
    const req = createRequest({
      method: 'HEAD',
      url: '/books/1',
      params: { bookId: 1 },
    })
    const res = createResponseOf(req)
    await waitResponse(req, res)
    assert.strictEqual(res._getData(), 'Head bookId: 1')
  })
  it('GET /books/:bookId', async function () {
    const req = createRequest({
      method: 'GET',
      url: '/books/1',
      params: { bookId: 1 },
    })
    const res = createResponseOf(req)
    await waitResponse(req, res)
    assert.strictEqual(res._getData(), 'Get bookId: 1')
  })
  it('GET /books/:bookId/authors/:authorId', async function () {
    const req = createRequest({
      method: 'GET',
      url: '/books/1/authors/2',
      params: { bookId: 1, authorId: 2 },
    })
    const res = createResponseOf(req)
    await waitResponse(req, res)
    assert.strictEqual(res._getData(), 'Get bookId 1 => authorId 2')
  })
})

describe(`Test option ${chalk.inverse('absolutePath')}`, function () {
  const router = azRouter({
    routeDir,
    absolutePath: path.join(__dirname, 'other-routes'),
  })
  it('GET /', async function () {
    const req = createRequest({
      method: 'GET',
      url: '/',
    })
    const res = createResponseOf(req)
    await waitResponse(req, res, router)
    assert.strictEqual(res._getData(), 'Get root of other')
  })
})

describe('Test loading CommonJS Module', function () {
  const router = azRouter({
    routeDir: path.relative(process.cwd(), path.join(__dirname, 'cjs-routes')),
  })
  it('GET /', async function () {
    const req = createRequest({
      method: 'GET',
      url: '/',
    })
    const res = createResponseOf(req)
    await waitResponse(req, res, router)
    assert.strictEqual(res._getData(), 'Get root of cjs')
  })
})
