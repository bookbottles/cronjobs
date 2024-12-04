import { ApiClient } from './apiClient';
import { config } from './common';
import { initCronjobs } from './cronjobs';

async function main() {
	const apiClient = ApiClient(config);
	const tasks = createTasks(apiClient);

	initCronjobs(tasks);
}

main().catch(console.error);
