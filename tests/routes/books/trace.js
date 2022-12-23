import {
  sampleParamTraceBooks1,
  sampleParamTraceBooks2,
} from '../../data.mocks'

export default (req, res) => {
  res.send('Tracing books')
}

export const middleware = [
  (req, res, next) => {
    req.sampleParam = sampleParamTraceBooks1
    next()
  },
  (req, res, next) => {
    req.sampleParam = req.sampleParam + sampleParamTraceBooks2
    next()
  },
]
