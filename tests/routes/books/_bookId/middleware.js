import { userId, permissionId } from '../../../data.mocks'

export const middlewareUser = (req, res, next) => {
  req.userId = userId
  next()
}

export const middlewarePermission = (req, res, next) => {
  req.permissionId = permissionId
  next()
}
