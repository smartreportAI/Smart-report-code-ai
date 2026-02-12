import pino from 'pino';

const isDev = process.env.NODE_ENV === 'development';

/**
 * Production-ready structured logger with PII redaction
 * Automatically redacts sensitive patient information from logs
 */
export const logger = pino({
  level: process.env.LOG_LEVEL ?? 'info',

  // Redact sensitive PII fields from logs (HIPAA compliance)
  redact: {
    paths: [
      'input.patient.name',
      'input.PatientName',
      'patient.name',
      'PatientName',
      'input.patient.email',
      'input.patient.contact',
      'req.headers.authorization', // Don't log JWT tokens
      'req.headers["x-api-key"]', // Don't log API keys
      'password',
      'apiKey',
    ],
    censor: '[REDACTED]',
  },

  // Serialize errors properly
  serializers: {
    err: pino.stdSerializers.err,
    req: pino.stdSerializers.req,
    res: pino.stdSerializers.res,
  },

  // Pretty print in development, JSON in production
  transport:
    isDev
      ? {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'yyyy-mm-dd HH:MM:ss',
          ignore: 'pid,hostname',
        },
      }
      : undefined,

  // Add timestamp to all logs
  timestamp: pino.stdTimeFunctions.isoTime,

  // Base context for all logs
  base: {
    env: process.env.NODE_ENV || 'development',
    service: 'smart-report-ai',
  },
});
