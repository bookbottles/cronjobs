import dotenv from 'dotenv';
import pino from 'pino';

import { config } from './config.js';

dotenv.config();

const nodeEnv = process.env.NODE_ENV || 'development';

const targets = [
	{
		target: 'pino-pretty',
		options: {
			colorize: true,
			levelFirst: true,
			translateTime: 'SYS:standard',
			singleLine: true,
			ignore: 'pid,hostname' //Ignore unnecessary fields
		}
	}
];

if (nodeEnv !== 'development')
	targets.push({
		target: '@serdnam/pino-cloudwatch-transport',
		options: {
			logGroupName: config?.aws?.groupName,
			logStreamName: config?.nodeEnv,
			awsRegion: config?.aws?.region,
			awsAccessKeyId: config?.aws?.accessKeyId,
			awsSecretAccessKey: config?.aws?.secretAccessKey
		}
	});

const transport = pino.transport({
	targets
});

/* use console logger for local development */
export const logger = nodeEnv === 'local' ? console : pino(transport).child({});

// Create a child logger with the traceId
export const createChildLogger = (context) => {
	if (nodeEnv === 'local') return console;

	return logger.child({ ...context });
};
