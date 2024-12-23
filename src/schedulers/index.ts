import { Job, Agenda } from '@hokify/agenda';
import timezone from 'dayjs/plugin/timezone';
import localeData from 'dayjs/plugin/localeData';
import utc from 'dayjs/plugin/utc.js';
import dotenv from 'dotenv';
import dayjs from 'dayjs';

import { JOBS_NAME, LOG_MSG } from '../common/constants';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import { config } from '../common/config.js';
import { ApiClient } from '../apiClient';
import { logger } from '../common';
import { Venue } from '../types';
import { Tasks } from '../tasks';

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(customParseFormat);
dayjs.extend(localeData);

dotenv.config();

export async function scheduleTasks(tasks: Tasks, apiClient: ApiClient): Promise<Agenda> {
	const agenda = new Agenda({ defaultLockLimit: 0, db: { address: config.mongoUrl } });
	await agenda.start();

	agenda.define(JOBS_NAME.PULL_NEW_ORDERS, tasks.pullPosOrders);
	agenda.define(JOBS_NAME.SYNC_ORDERS, tasks.syncOrders);

	/* schedule eon closing cronjob for all of the working venues */
	agenda.define(JOBS_NAME.SCHEDULE_CLOSE_VENUES, async () => {
		try {
			const venues = await apiClient.getVenues({ features: ['vemospay'] });

			for (const venue of venues) {
				try {
					const scheduleTime = _getScheduleTime(venue);
					const jobName = `${JOBS_NAME.CLOSE_VENUE}_${venue.id}`;
					// agenda.jobs({ name: jobName }).then((jobs) => jobs.forEach((job) => job.remove()));
					agenda.define(jobName, (job: Job<any>) => tasks.closeVenue(job.attrs.data.venueId));
					await agenda.schedule(scheduleTime, jobName, { venueId: venue.id });
				} catch (err: any) {
					logger.error(err, `Error scheduling CLOSE_VENUE event ${err?.message}`);
				}
			}
		} catch (err: any) {
			logger.error(err, `${LOG_MSG.ERROR_SCHEDULING} ${err?.message}`);
		}
	});

	await agenda.every('3 minutes', JOBS_NAME.PULL_NEW_ORDERS);
	await agenda.every('2 minutes', JOBS_NAME.SYNC_ORDERS);

	/* schedule close venue events every day */
	await agenda.every('24 hours', JOBS_NAME.SCHEDULE_CLOSE_VENUES);

	return agenda;
}

function _getScheduleTime(venue: Venue) {
	const tz = venue.hours?.timezone || 'US/Central';

	const today = dayjs().tz(tz);
	const venueToday = (venue.hours?.days || {})[today.format('ddd').toLowerCase()];

	if (!venueToday) throw new Error(`Venue ${venue.id} hasn't defined hours for today`);

	/* assume format is hhmmAM */
	let closeHours = Number(venueToday.close.split(':')[0]);
	const closeMinutes = Number(venueToday.close.split(':')[1]);
	const openHours = Number(venueToday.open.split(':')[0]);

	let closeDate = today.startOf('day').add(closeHours, 'hours').add(closeMinutes, 'minutes');

	// if closes next day
	if (closeHours < openHours) closeDate = closeDate.add(1, 'day');

	if (!closeDate.isValid()) throw new Error(`Invalid close date for venue ${venue.id}`);

	return closeDate.toDate();
}
