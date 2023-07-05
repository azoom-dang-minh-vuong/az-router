import { Router } from 'express-serve-static-core'
import applyWaitingMiddlewareToRouter from '../../src/helpers/applyWaitingMiddlewareToRouter'
import assert from 'assert'
import express from 'express'
import { createRequest, createResponse } from 'node-mocks-http'
import EventEmitter from 'events'

const createResponseOf = (req: ReturnType<typeof createRequest>) =>
  createResponse({
    req,
    eventEmitter: EventEmitter,
  })

let router: Router
let promise: Promise<void>
let resolve: Function
let reject: Function
let req: ReturnType<typeof createRequest>
let res: ReturnType<typeof createResponseOf>
let app: (req: ReturnType<typeof createRequest>, res: ReturnType<typeof createResponseOf>) => void
beforeEach(() => {
  router = express.Router()
  app = (req, res) =>
    router(req, res, (err) => {
      err ? res.emit('error', err) : res.end()
    })
  promise = new Promise((rs, rj) => {
    resolve = rs
    reject = rj
  })
  req = createRequest({
    method: 'GET',
    path: '/',
  })
  res = createResponseOf(req)
})

describe('Test function applyWaitingMiddlewareToRouter', () => {
  it('Request will be suspended if the promise is pending', async () => {
    applyWaitingMiddlewareToRouter(router, promise)
    app(req, res)
    assert.strictEqual(res._isEndCalled(), false)
  })

  it('Request will be continue after the promise is fulfilled', async () => {
    applyWaitingMiddlewareToRouter(router, promise)
    app(req, res)
    resolve()
    await new Promise((rs, rj) => {
      res.on('finish', rs).on('error', rj)
    })
  })

  it('Request will be failed after the promise is rejected', async () => {
    applyWaitingMiddlewareToRouter(router, promise)
    app(req, res)
    const err = new Error('sample error')
    reject(err)
    const actualErr = await new Promise((rs, rj) => {
      res.on('finish', rj).on('error', rs)
    })
    assert.strictEqual(actualErr, err)
  })

  describe('Test removeLayerMiddleware', () => {
    it('should remove layerMiddleware from router.stack after the promise is fulfilled and have no request that is inprogress', async () => {
      applyWaitingMiddlewareToRouter(router, promise)
      app(req, res)
      resolve()
      await new Promise((rs, rj) => {
        res.on('finish', rs).on('error', rj)
      })
      assert.strictEqual(router.stack.length, 0)
    })

    it('should not remove layerMiddleware from router.stack after the promise is fulfilled and have request that is inprogress', async () => {
      applyWaitingMiddlewareToRouter(router, promise)
      const req2 = createRequest({
        method: 'POST',
        path: '/',
      })
      const res2 = createResponseOf(req2)
      app(req, res)
      router(req2, res2, () => {})
      resolve()
      await new Promise((rs, rj) => {
        res.on('finish', rs).on('error', rj)
      })
      assert.strictEqual(res2._isEndCalled(), false)
      assert.notStrictEqual(router.stack.length, 0)
    })
  })
})
