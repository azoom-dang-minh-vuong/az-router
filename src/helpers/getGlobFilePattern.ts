import { JSExt } from '../types'
const jsExt = ['js', 'cjs', 'mjs', 'ts'] as JSExt[]

const getGlobFilePattern = (ext: JSExt[] = []) =>
  `**/@(${(ext.length ? jsExt.filter((ext) => ext.includes(ext)) : [jsExt[0]])
    .map((ext) => `*.${ext}`)
    .join(`|`)})`

export default getGlobFilePattern
