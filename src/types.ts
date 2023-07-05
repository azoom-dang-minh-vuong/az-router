import { Router } from 'express-serve-static-core'

export type JSExt = 'js' | 'cjs' | 'mjs' | 'ts'

export interface AzRouter extends Router {
  /**
   * Get promise which resolved after all routes have been applied to the router
   */
  promise(): Promise<void>
}

export interface Options {
  /**
   * Propose relative path where contains route modules, default is `routes` directory inside current working directory
   * @default 'routes'
   */
  routeDir?: string
  /**
   * Absolute path of `routes` directory. If this exists, this will be overrided `routeDir` option
   */
  absolutePath?: string
  /**
   * @default express.Router()
   */
  baseRouter?: Router
  /**
   * Propose file module extensions to importing
   * @default ['js']
   */
  ext?: JSExt[]
  /**
   * Enable debug?
   * @default false
   */
  debug?: boolean
}
