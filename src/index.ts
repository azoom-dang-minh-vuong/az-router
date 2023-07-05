import path from 'path'
import util from 'util'
import glob from 'glob'
import express from 'express'
import type { AzRouter, Options } from './types'
import getGlobFilePattern from './helpers/getGlobFilePattern'
import applyWaitingMiddlewareToRouter from './helpers/applyWaitingMiddlewareToRouter'
import {
  applyAPIConfigsToRouter,
  getAPIConfigs,
  resolveModulesFromAPIConfigs,
} from './helpers/apiConfigs'

const globP = util.promisify(glob)

export { AzRouter, Options }

function azRouter(options: Options = {}) {
  const routeDir = options.routeDir || 'routes'
  const filePattern = getGlobFilePattern(options.ext)
  const absoluteRouteDir = options.absolutePath || path.join(process.cwd(), routeDir)
  const router = (options.baseRouter || express.Router()) as AzRouter

  const promise = globP(filePattern, { cwd: absoluteRouteDir })
    .then(getAPIConfigs)
    .then(async (apiConfigs) => {
      const relativeFilePaths = apiConfigs.map((config) => config.relativeFilePath)
      const apiModules = await resolveModulesFromAPIConfigs(relativeFilePaths, absoluteRouteDir)
      return applyAPIConfigsToRouter(router, apiConfigs, apiModules, options)
    })

  applyWaitingMiddlewareToRouter(router, promise)
  router.promise = () => promise

  return router
}

export default azRouter
