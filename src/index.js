import Agenda from 'agenda';
import dotenv from 'dotenv';
import { pullNewOrdersJob, syncTicketsJob, closeVenueJob } from './jobs/jobs.js';
import express from 'express';
import moment from 'moment-timezone';
import { ApiClient } from './apiClient.js';

dotenv.config();

async function setupHealthCheck() {
	const app = express();
	app.get('/', (req, res) => {
		res.send('App is running!');
	});

	const PORT = process.env.PORT || 3000;
	app.listen(PORT, () => {
		console.log(`Server is running on port ${PORT}`);
	});
}

// This function will schedule the closing of the venues based on their closing time
async function scheduleClosingVenue(job, done) {
	try {
		const today = moment().format('ddd').toLowerCase(); // Get today's day in lowercase
		const venues = await ApiClient().getVenues(); // Assuming this fetches all venues

		venues.forEach((venue) => {
			if (venue.hours && venue.hours.days[today].isOpen) {
				const openTime = moment(venue.hours.days[today].open, 'hhA');
				const closeTime = moment(venue.hours.days[today].close, 'hhA');
				let scheduleTime;

				if (closeTime.isBefore(openTime)) {
					// Closes after midnight
					scheduleTime = moment
						.tz(
							`${moment().add(1, 'days').format('YYYY-MM-DD')} ${venue.hours.days[today].close}`,
							'YYYY-MM-DD hhA',
							'America/New_York'
						)
						.toDate();
				} else {
					// Closes before midnight
					scheduleTime = moment
						.tz(
							`${moment().format('YYYY-MM-DD')} ${venue.hours.days[today].close}`,
							'YYYY-MM-DD hhA',
							'America/New_York'
						)
						.toDate();
				}

				agenda.schedule(scheduleTime, JOBS_NAME.CLOSE_VENUE, { venueId: venue.id });
				console.log(`Scheduled CLOSE_VENUE for venue ${venue.id} at ${scheduleTime}`);
			}
		});
	} catch (error) {
		console.error('Error scheduling ON_VENUE_CLOSE:', error);
	}

	done();
}

async function main() {
	await setupHealthCheck();
	console.log('Connecting DB...');
	const agenda = new Agenda({ db: { address: process.env.MONGO_DB_URL } });
	console.log('DB connected! 🔥');

	console.log('Starting agenda...');
	await agenda.start();
	console.log('Agenda started! 💩');

	/* DEFINE JOBS */
	agenda.define(JOBS_NAME.PULL_NEW_TICKETS, { priority: 'high', concurrency: 10 }, pullNewOrdersJob);
	agenda.define(JOBS_NAME.SYNC_TICKETS, { priority: 'high', concurrency: 10 }, syncTicketsJob);
	agenda.define(JOBS_NAME.CLOSE_VENUE, closeVenueJob);
	agenda.define(JOBS_NAME.SCHEDULE_CLOSING_VENUE, async (job, done) => scheduleClosingVenue(job, done));

	/* SCHEDULE JOBS */
	await agenda.every('2 minutes', JOBS_NAME.PULL_NEW_TICKETS);
	await agenda.every('2 minutes', JOBS_NAME.SYNC_TICKETS);
	// Schedule the 'schedule closing tickets' job to run every day at 10 AM EST
	await agenda.every('0 10 * * *', JOBS_NAME.SCHEDULE_CLOSING_VENUE, {}, { timezone: 'America/New_York' });

	console.log('All scheduled jobs have been initialized.');
}

main();

const JOBS_NAME = {
	PULL_NEW_TICKETS: 'PULL_NEW_TICKETS',
	SYNC_TICKETS: 'SYNC_TICKETS',
	CLOSE_VENUE: 'CLOSE_VENUE',
	SCHEDULE_CLOSING_VENUE: 'SCHEDULE_CLOSING_VENUE'
};
