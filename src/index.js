import customParseFormat from 'dayjs/plugin/customParseFormat.js';
import timezone from 'dayjs/plugin/timezone.js';
import utc from 'dayjs/plugin/utc.js';
import mongoose from 'mongoose';
import express from 'express';
import Agenda from 'agenda';
import dotenv from 'dotenv';
import dayjs from 'dayjs';

import { JOBS_NAME, FEATURES, JOBS_TIME, LOG_MSG } from './common/constants.js';
import { pullNewOrdersJob, syncOrdersJob, closeVenueJob } from './jobs/jobs.js';
import { logger } from './common/logger.js';
import { ApiClient } from './apiClient.js';
import { config } from './common/config.js';

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(customParseFormat);

dotenv.config();

async function setupHealthCheck() {
	const app = express();
	app.get('/', (req, res) => {
		res.send(LOG_MSG.API_RUNNING);
	});

	const PORT = config.nodePort || 3000;

	app.listen(PORT, () => {
		logger.info(`${LOG_MSG.SERVER_RUNNING} ${PORT}`);
	});
}

// This function will schedule the closing of the venues based on their closing time
async function scheduleClosingVenue(job, done, agenda) {
	try {
		const today = dayjs().format(JOBS_TIME.DAY_FORMAT).toLowerCase(); // Get today's day in lowercase
		const venues = await ApiClient().getVenues({ features: FEATURES }); // Assuming this fetches all venues

		if (!venues) return;

		venues.forEach((venue) => {
			if (venue?.hours && venue?.hours?.days?.[today].isOpen) {
				const openTime = dayjs(venue.hours.days[today].open, JOBS_TIME.HOUR);
				const closeTime = dayjs(venue.hours.days[today].close, JOBS_TIME.HOUR);
				let scheduleTime;

				if (closeTime.isBefore(openTime)) {
					// Closes after midnight
					scheduleTime = dayjs
						.tz(
							`${dayjs().add(1, JOBS_TIME.DAYS).format(JOBS_TIME.WEEK_FORMAT)} ${venue.hours.days[today].close}`,
							JOBS_TIME.FORMAT,
							JOBS_TIME.TIMEZONE
						)
						.toDate();
				} else {
					// Closes before midnight
					scheduleTime = dayjs
						.tz(
							`${dayjs().format(JOBS_TIME.WEEK_FORMAT)} ${venue.hours.days[today].close}`,
							JOBS_TIME.FORMAT,
							JOBS_TIME.TIMEZONE
						)
						.toDate();
				}

				agenda.schedule(scheduleTime, JOBS_NAME.CLOSE_VENUE, { venueId: venue.id });
				logger.info(`${LOG_MSG.CLOSE_SCHEDULING} ${venue.id} at ${scheduleTime}`);
			}
		});
	} catch (error) {
		logger.error(error, `${LOG_MSG.ERROR_SCHEDULING} ${error?.message}`);
	}

	done();
}

async function main() {
	try {
		await setupHealthCheck();
		logger.info(LOG_MSG.HEALTH_CHECK);

		// Connect to the database
		logger.info(LOG_MSG.DB_CONNECTING);
		await mongoose.connect(config.mongoUrl);
		logger.info(LOG_MSG.DB_CONNECTED);

		// Initialize agenda
		const agenda = new Agenda({ db: { address: config.mongoUrl } });
		logger.info(LOG_MSG.AGENDA_STARTING);
		await agenda.start();
		logger.info(LOG_MSG.AGENDA_STARTED);

		// Define jobs
		defineJobs(agenda);

		// Excecute jobs
		await scheduleJobs(agenda);

		logger.info(LOG_MSG.JOBS_INITIALIZED);
	} catch (error) {
		logger.error(error, LOG_MSG.ERROR_INITIALIZATION);
		process.exit(1); // Exit the process with an error
	}
}

function defineJobs(agenda) {
	logger.info(LOG_MSG.JOBS_DEFINED);

	agenda.define(JOBS_NAME.PULL_NEW_ORDERS, { priority: 'high', concurrency: 1 }, pullNewOrdersJob);
	agenda.define(JOBS_NAME.SYNC_ORDERS, { priority: 'high', concurrency: 1 }, syncOrdersJob);
	agenda.define(JOBS_NAME.CLOSE_VENUE, closeVenueJob);
	agenda.define(JOBS_NAME.SCHEDULE_CLOSING_VENUE, async (job, done) => {
		return scheduleClosingVenue(job, done, agenda);
	});

	logger.info(LOG_MSG.JOBS_DEFINED_SUCCESS);
}

async function scheduleJobs(agenda) {
	logger.info(LOG_MSG.JOBS_SCHEDULING);

	await agenda.every(JOBS_TIME.THREE_MINUTES, JOBS_NAME.PULL_NEW_ORDERS);
	await agenda.every(JOBS_TIME.TWO_MINUTES, JOBS_NAME.SYNC_ORDERS);

	// Schedule the 'schedule closing tickets' job to run every day at 10 AM EST
	await agenda.schedule(JOBS_TIME.EVERY_DAY_AT_10_AM, JOBS_NAME.SCHEDULE_CLOSING_VENUE, { timezone: JOBS_TIME.TIMEZONE });

	logger.info(LOG_MSG.JOBS_SCHEDULING_SUCCESS);
}

main();
