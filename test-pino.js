const pino = require('pino');
const pinoLogger = pino();

const originalError = pinoLogger.error.bind(pinoLogger);

pinoLogger.error = (...args) => {
  originalError(...args);
  console.log("Sentry interceptor fired!");
};

const logger = pinoLogger;

logger.info("Info works!");
logger.error("Error works!");
