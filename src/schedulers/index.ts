import { Agenda } from '@hokify/agenda';

import { JOBS_NAME } from '../common/constants';
import { config } from '../common/config';
import { Tasks } from '../tasks';

export async function scheduleTasks(tasks: Tasks): Promise<Agenda> {
	const agenda = new Agenda({
		defaultConcurrency: 200,
		defaultLockLifetime: 5 * 60000, // 3 minutes
		defaultLockLimit: 0, // no limit
		db: { address: config.mongoUrl }
	});

	await agenda.start();
	console.log('✅ Agenda started');

	agenda.define(JOBS_NAME.PULL_NEW_ORDERS, tasks.pullPosOrders);
	agenda.define(JOBS_NAME.SYNC_ORDERS, tasks.syncOrders);
	agenda.define(JOBS_NAME.CLOSE_VENUES, tasks.closeVenues);

	await agenda.every('3 minutes', JOBS_NAME.PULL_NEW_ORDERS);
	await agenda.every('2 minutes', JOBS_NAME.SYNC_ORDERS);
	await agenda.every('10 minutes', JOBS_NAME.CLOSE_VENUES);

	return agenda;
}
