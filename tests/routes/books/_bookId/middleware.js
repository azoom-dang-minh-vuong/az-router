import { userId, permissionId } from '../../../data.mocks'

const middlewareUser = (req, res, next) => {
  req.userId = userId
  next()
}

const middlewarePermission = (req, res, next) => {
  if (req.userId !== userId) return res.sendStatus(401)
  req.permissionId = permissionId
  next()
}

export { middlewareUser as middleware01, middlewarePermission as middleware02 }
