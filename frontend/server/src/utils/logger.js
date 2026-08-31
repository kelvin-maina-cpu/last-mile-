import pino from 'pino'

const isProduction = process.env.NODE_ENV === 'production'

const logger = pino({
  level: process.env.LOG_LEVEL || (isProduction ? 'info' : 'debug'),
  transport: isProduction
    ? undefined // JSON to stdout in production
    : { target: 'pino-pretty', options: { colorize: true, translateTime: 'SYS:standard' } },
  base: { service: 'reflex-fallback-server' },
})

export default logger
