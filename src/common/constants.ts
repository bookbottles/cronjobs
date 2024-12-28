export const JOBS_NAME = {
	PULL_NEW_ORDERS: 'PULL_NEW_ORDERS',
	SYNC_ORDERS: 'SYNC_ORDERS',
	CLOSE_VENUES: 'CLOSE_VENUES'
};

export const FEATURES = ['vemospay'];

export const JOBS_TIME = {
	DAY_FORMAT: 'ddd',
	DAYS: 'days',
	EVERY_DAY_AT_10_AM: '0 10 * * *'
};

export const LOG_MSG = {
	CLOSE_SCHEDULING: 'Scheduled CLOSE_VENUE for venue',
	ERROR_SCHEDULING: 'Error scheduling ON_VENUE_CLOSE:',
	HEALTH_CHECK: 'Health check initialized.',
	DB_CONNECTING: 'Connecting to the database...',
	DB_CONNECTED: 'Database connected! 🔥',
	AGENDA_STARTING: 'Starting agenda...',
	AGENDA_STARTED: 'Agenda started! 💩',
	JOBS_DEFINED: 'Defining jobs...',
	JOBS_DEFINED_SUCCESS: 'Jobs defined successfully.',
	JOBS_SCHEDULING: 'Scheduling jobs...',
	JOBS_SCHEDULING_SUCCESS: 'Jobs scheduled successfully.',
	JOBS_INITIALIZED: 'All jobs have been defined and scheduled successfully.',
	ERROR_INITIALIZATION: 'Error during initialization:',
	ERROR_INITIALIZATION_EXIT: 'Exit the process with an error'
};

export const POS_TYPES = {
	CLOVER: 'clover',
	TOAST: 'toast',
	SQUARE: 'square',
	OMNIVORE: 'omnivore',
	UPSERVE: 'upserve'
};
