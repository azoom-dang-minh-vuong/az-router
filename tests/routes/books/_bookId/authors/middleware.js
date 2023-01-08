import { permissionId } from '../../../../data.mocks'

export const middlewarePermission = (req, res, next) => {
  if (req.permissionId !== permissionId) return res.sendStatus(403)
  next()
}
