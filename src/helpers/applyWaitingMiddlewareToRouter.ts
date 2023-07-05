import { Response, Router } from 'express-serve-static-core'

const applyWaitingMiddlewareToRouter = (router: Router, promise: Promise<void>) => {
  const waitingResponses: Response[] = []
  router.use((req, res, next) => {
    waitingResponses.push(res)
    res.once('finish', () => {
      waitingResponses.splice(waitingResponses.indexOf(res), 1)
      removeLayerMiddleware()
    })
    promise.then(next).catch(next)
  })
  const layerMiddleware = router.stack[router.stack.length - 1]
  const removeLayerMiddleware = () => {
    if (waitingResponses.length) return
    // => `waitingResponses` is empty
    // TODO: remove `layerMiddleware` from `router.stack`
    const indexOfLayer = router.stack.indexOf(layerMiddleware)
    if (indexOfLayer >= 0) router.stack.splice(indexOfLayer, 1)
  }
  promise.then(removeLayerMiddleware)
}

export default applyWaitingMiddlewareToRouter
