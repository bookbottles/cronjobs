import Agenda, { Job } from 'agenda';
import timezone from 'dayjs/plugin/timezone.js';
import utc from 'dayjs/plugin/utc.js';
import dotenv from 'dotenv';
import dayjs from 'dayjs';

import { JOBS_NAME, LOG_MSG } from '../common/constants';
import customParseFormat from 'dayjs/plugin/customParseFormat.js';
import { config } from '../common/config.js';
import { ApiClient } from '../apiClient';
import { logger } from '../common';
import { Venue } from '../types';
import { Tasks } from '../tasks';

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(customParseFormat);

dotenv.config();

export async function scheduleTasks(tasks: Tasks, apiClient: ApiClient): Promise<Agenda> {
	const agenda = new Agenda({ db: { address: config.mongoUrl } });
	await agenda.start();

	agenda.define(JOBS_NAME.PULL_NEW_ORDERS, tasks.pullPosOrders);
	agenda.define(JOBS_NAME.SYNC_ORDERS, tasks.syncOrders);

	/* schedule eon closing cronjob for all of the working venues */
	agenda.define(JOBS_NAME.SCHEDULE_CLOSE_VENUES, async (job: Job, done) => {
		try {
			const venues = await apiClient.getVenues({ features: ['vemospay'] });

			for (const venue of venues) {
				try {
					const scheduleTime = _getScheduleTime(venue);
					const jobName = `${JOBS_NAME.CLOSE_VENUE}:${venue.id}`;

					agenda.define(jobName, (job: Job) => tasks.closeVenue(job.attrs.data.venueId));
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
	await agenda.every('24 hours', JOBS_NAME.SCHEDULE_CLOSE_VENUES, {});

	return agenda;
}

function _getScheduleTime(venue: Venue): Date {
	const tz = venue.hours?.timezone || 'US/Central';
	const today = dayjs().tz(tz);
	const venueToday = (venue.hours?.days || {})[today.format('ddd').toLowerCase()];

	if (!venueToday) throw new Error(`Venue ${venue.id} hasn't defined hours for today`);

	/* assume format is hhmmAM */
	let hours = Number(venueToday.close.slice(0, 2));
	const minutes = Number(venueToday.close.slice(2, 4));
	const ampm = venueToday.close.slice(4, 6);

	/* if venue closes at 12AM, we need to convert it to 00:00 */
	if (hours === 12 && ampm === 'AM') hours = 0;

	let closeDate = today.startOf('day').add(hours, 'hours').add(minutes, 'minutes');

	if (ampm === 'PM') closeDate = closeDate.add(12, 'hours').add(5, 'minutes').tz(tz);
	if (ampm === 'AM') closeDate = closeDate.add(1, 'day').add(5, 'minutes').tz(tz);

	return closeDate.toDate();
}
