import { randomUUID } from 'crypto'
import logger from '../utils/logger.js'

const REQUEST_ID_HEADER = 'x-request-id'

function requestId(req, res, next) {
  // Accept client-supplied request ID or generate a new one
  const requestId = req.headers[REQUEST_ID_HEADER] || randomUUID()

  // Attach to request and response
  req.requestId = requestId
  res.setHeader(REQUEST_ID_HEADER, requestId)

  // Create a child logger with the request ID so every log in this
  // request context automatically includes it — no manual passing needed.
  req.log = logger.child({ requestId })

  next()
}

export default requestId
