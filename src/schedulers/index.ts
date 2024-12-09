import Agenda, { Job } from 'agenda';
import timezone from 'dayjs/plugin/timezone.js';
import utc from 'dayjs/plugin/utc.js';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import dayjs from 'dayjs';

import { JOBS_NAME, JOBS_TIME, LOG_MSG } from '../common/constants';
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

export async function scheduleTasks(mongo: mongoose.mongo.MongoClient, tasks: Tasks, apiClient: ApiClient) {
	const agenda = new Agenda({ db: { address: config.mongoUrl } });
	await agenda.start();

	agenda.define(JOBS_NAME.PULL_NEW_ORDERS, tasks.pullPosOrders);
	agenda.define(JOBS_NAME.SYNC_ORDERS, tasks.syncOrders);
	agenda.define(JOBS_NAME.CLOSE_VENUE, (job: Job) => tasks.closeVenue(job.attrs.data.venueId));

	/* schedule eon closing cronjob for all of the working venues */
	agenda.define(JOBS_NAME.SCHEDULE_CLOSING_VENUE, async (job: Job, done) => {
		try {
			const venues = await apiClient.getVenues({ features: ['vemospay'] });

			for (const venue of venues) {
				try {
					const scheduleTime = _getScheduleTime(venue);
					await agenda.schedule(scheduleTime, JOBS_NAME.CLOSE_VENUE, { venueId: venue.id });
				} catch (err: any) {
					logger.error(err, `Error scheduling ON_VENUE_CLOSE: ${err?.message}`);
				}
			}
		} catch (err: any) {
			logger.error(err, `${LOG_MSG.ERROR_SCHEDULING} ${err?.message}`);
		}
	});

	await agenda.every(JOBS_TIME.THREE_MINUTES, JOBS_NAME.PULL_NEW_ORDERS);
	await agenda.every(JOBS_TIME.TWO_MINUTES, JOBS_NAME.SYNC_ORDERS);
	await agenda.schedule(JOBS_TIME.EVERY_DAY_AT_10_AM, JOBS_NAME.SCHEDULE_CLOSING_VENUE, { timezone: 'America/Chicago' });
}

function _getScheduleTime(venue: Venue): Date {
	const tz = venue.hours?.timezone || 'America/Chicago';
	const today = dayjs().format('ddd').toLowerCase(); // Get today's day in lowercase
	const venueToday = venue.hours?.days[today];

	if (!venueToday) throw new Error(`Venue ${venue.id} hasn't defined hours for today`);

	const openTime = dayjs(venueToday.open, 'hhA');
	let closeTime = dayjs(venueToday.close).isBefore(openTime)
		? dayjs(venueToday.close, 'hhA').add(5, 'minute') // Closes before midnight
		: dayjs(venueToday.close, 'hhA').add(5, 'minute').add(1, 'day'); // Closes after midnight

	return dayjs.tz(closeTime, 'YYYY-MM-DD hhA', tz).toDate();
}
