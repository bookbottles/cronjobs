export const JOBS_NAME = {
	PULL_NEW_ORDERS: 'PULL_NEW_ORDERS',
	SYNC_ORDERS: 'SYNC_ORDERS',
	CLOSE_VENUE: 'CLOSE_VENUE',
	SCHEDULE_CLOSING_VENUE: 'SCHEDULE_CLOSING_VENUE'
};

export const FEATURES = ['vemospay'];

export const JOBS_TIME = {
	FORMAT: 'YYYY-MM-DD hhA',
	WEEK_FORMAT: 'YYYY-MM-DD',
	DAY_FORMAT: 'ddd',
	HOUR: 'hhA',
	DAYS: 'days',
	TIMEZONE: 'America/New_York',
	TWO_MINUTES: '2 minutes',
	THREE_MINUTES: '3 minutes',
	FIVE_MINUTES: '5 minutes',
	TEN_MINUTES: '10 minutes',
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
	ERROR_INITIALIZATION_EXIT: 'Exit the process with an error',
	API_RUNNING: 'App is running!',
	SERVER_RUNNING: 'Server is running on port'
};

export const POS_TYPES = {
	CLOVER: 'clover',
	TOAST: 'toast',
	SQUARE: 'square',
	OMNIVORE: 'omnivore',
	UPSERVE: 'upserve'
};
