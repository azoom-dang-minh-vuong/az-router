import { sampleParamGetBooks } from '../../data.mocks'

export default (req, res) => {
  res.send('Get books')
}

export const middleware = (req, res, next) => {
  req.sampleParam = sampleParamGetBooks
  next()
}
