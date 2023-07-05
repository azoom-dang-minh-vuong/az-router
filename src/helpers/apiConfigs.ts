import { RequestHandler, Router } from 'express-serve-static-core'
import chalk from 'chalk'
import path from 'path'
import type { Options } from '../types'
import { reqMethods } from '../constants'

const isFunction = (func: any) => typeof func === 'function'
const debugPrefix = chalk.greenBright('[AzRouter][DEBUG] ')

export const parseMethodAndRoutePathFromFilePath = (relativeFilePath: string) => {
  const indexOfLastSlash = relativeFilePath.lastIndexOf('/')
  const methodName = relativeFilePath.slice(indexOfLastSlash + 1, relativeFilePath.lastIndexOf('.'))
  const isValidMethod = reqMethods.includes(methodName)
  if (!isValidMethod) {
    return null
  }
  const routePath =
    indexOfLastSlash >= 0
      ? ('/' + relativeFilePath.slice(0, indexOfLastSlash)).replace(/\/_/g, '/:')
      : '/'
  return {
    methodName,
    routePath,
    relativeFilePath,
  }
}

export const getAPIConfigs = (relativeFilePaths: string[]) => {
  return relativeFilePaths
    .map(parseMethodAndRoutePathFromFilePath)
    .filter(Boolean)
    .sort((config1, config2) => {
      // Place middleware on top
      if (config1.routePath.startsWith(config2.routePath) && config2.methodName === reqMethods[0]) {
        return 1
      }
      if (config2.routePath.startsWith(config1.routePath) && config1.methodName === reqMethods[0]) {
        return -1
      }

      // Descending sort for exception handling at dynamic routes
      if (config1.routePath !== config2.routePath)
        return config1.routePath < config2.routePath ? 1 : -1
      // Orderring by index in reqMethods
      return reqMethods.indexOf(config1.methodName) - reqMethods.indexOf(config2.methodName)
    })
}

export const resolveModulesFromAPIConfigs = async (
  relativeFilePaths: string[],
  absoluteRouteDir: string
) => {
  const modules = []
  for (const relativeFilePath of relativeFilePaths) {
    const absoluteFilePath = path.join(absoluteRouteDir, relativeFilePath)
    const module = await import(absoluteFilePath)
    modules.push(module)
  }
  return modules
}

const getDebugMessage = ({ methodName, routePath }) =>
  methodName === reqMethods[0]
    ? `Applying middleware for route:${chalk.bold(' ')}${routePath}`
    : `Applying route ${chalk.bold(methodName.toUpperCase())} ${routePath}`

export const applyAPIConfigsToRouter = (
  router: Router,
  apiConfigs: Awaited<ReturnType<typeof getAPIConfigs>>,
  apiModules: any[],
  options: Options
) => {
  const debug = (msg: string) => options.debug && process.stdout.write(msg)
  const debugMessages = apiConfigs.map(getDebugMessage)
  const maxLength = debugMessages.reduce((max, msg) => (msg.length > max ? msg.length : max), 0)

  for (let i = 0; i < apiConfigs.length; i++) {
    const { methodName, routePath } = apiConfigs[i]
    const module = apiModules[i]
    const msg = debugMessages[i]
    debug(debugPrefix + msg + ' '.repeat(maxLength - msg.length))
    const handlers: RequestHandler[] = []
    if (methodName === reqMethods[0]) {
      // Applying middleware
      if (typeof module === 'object') {
        handlers.push(...Object.values(module as Record<string, RequestHandler>).flat())
      } else if (isFunction(module)) {
        // In CommonJS, the `module` can be a function
        handlers.push(module)
      }
      if (handlers.length) {
        router.use(routePath, ...handlers)
        debug(`   ${chalk.green('⇒ Succeeded!')}\n`)
      } else {
        debug(`   ${chalk.yellow(chalk.bold('⇒ No handling function'))}\n`)
      }
    } else {
      if (typeof module.middleware === 'object') {
        handlers.push(...Object.values(module.middleware as Record<string, RequestHandler>).flat())
      } else if (isFunction(module.middleware)) {
        handlers.push(module.middleware)
      }

      if (isFunction(module)) {
        handlers.push(module)
      } else if (isFunction(module.default)) {
        handlers.push(module.default)
      }
      if (handlers.length) {
        router[methodName](routePath, ...handlers)
        debug(`   ${chalk.green('⇒ Succeeded!')}\n`)
      } else {
        debug(`   ${chalk.yellow(chalk.bold('⇒ No handling function'))}\n`)
      }
    }
  }
  debug(debugPrefix + 'Initializing routes completed!\n')
}
