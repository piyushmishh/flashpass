/**
 * Application logger built on Winston.
 *
 * Two transports:
 *   - Console with colorised output for dev ergonomics
 *   - File transport for structured JSON logs in production
 *
 * Every module imports this single instance so we get consistent formatting
 * and can swap transports (e.g. to Datadog, ELK) in one place.
 */

import winston from 'winston';

const { combine, timestamp, colorize, printf, json } = winston.format;

// Human-readable format for the console — makes tailing logs in dev enjoyable
const devFormat = printf(({ level, message, timestamp, ...meta }) => {
  const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
  return `${timestamp} [${level}]${metaStr}: ${message}`;
});

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  defaultMeta: { service: 'flashpass' },
  transports: [
    // Console: colorised in dev, structured JSON in production
    new winston.transports.Console({
      format:
        process.env.NODE_ENV === 'production'
          ? combine(timestamp(), json())
          : combine(
              colorize({ all: true }),
              timestamp({ format: 'HH:mm:ss.SSS' }),
              devFormat
            ),
    }),

    // File: always JSON for machine parsing — errors get their own file
    // so you can grep them separately during an incident.
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
      format: combine(timestamp(), json()),
      maxsize: 10_485_760, // 10 MB rotation
      maxFiles: 5,
    }),
    new winston.transports.File({
      filename: 'logs/combined.log',
      format: combine(timestamp(), json()),
      maxsize: 10_485_760,
      maxFiles: 5,
    }),
  ],
});
