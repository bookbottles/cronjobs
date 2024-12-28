import dotenv from 'dotenv';
dotenv.config();

const env = process.env;

/********************* VALIDATION *********************/
const requiredVariables = ['CRONJOBS_API', 'CRONJOBS_API_KEY', 'MONGO_DB_URL'];
const missingVariables = getMissingVariables(requiredVariables, env);

if (missingVariables.length) {
	console.error(`[missing_variables_error]: Missing variables: ${JSON.stringify(missingVariables)}`);
	process.exit();
}

/**************************************************** */
export const config = {
	nodeEnv: env.NODE_ENV || 'dev',
	nodePort: Number(env.PORT) || 3000,
	pageSize: Number(env.PAGE_SIZE) || 10,
	cronjob: {
		baseUrl: env.CRONJOBS_API || '',
		apiKey: env.CRONJOBS_API_KEY || ''
	},
	mongoUrl: env.MONGO_DB_URL || '',
	aws: {
		accessKeyId: env.AWS_ACCESS_KEY_ID || '',
		secretAccessKey: env.AWS_SECRET_ACCESS_KEY || '',
		region: env.AWS_REGION || 'us-east-1',
		groupName: env.AWS_GROUP_NAME || 'SystemVemospay'
	},
	cloverPage: Number(env.CLOVER_PROCESS_PAGE) || 3,
	excludedSyncPOS: env.EXCLUDED_POS ? env.EXCLUDED_POS.split(',') : []
};

function getMissingVariables(requiredVariables: string[], envVars: any) {
	return requiredVariables.filter((varName) => !envVars[varName]);
}
