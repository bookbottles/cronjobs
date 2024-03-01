import Agenda from 'agenda';
import dotenv from 'dotenv';
import { closeTicketsJob, pullNewTicketsJob } from './jobs/tickets.jobs.js';
import express from 'express';

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

async function main() {
	setupHealthCheck(); // This is just to make sure the app is running on Heroku
	console.log('Connecting DB...');
	const agenda = new Agenda({ db: { address: process.env.MONGO_DB_URL } });
	console.log('DB connected! 🔥');

	console.log('Starting agenda...');
	await agenda.start();
	console.log('Agenda started! 💩');

	/* DEFINE JOBS */
	await agenda.define('PULL_NEW_TICKETS', { priority: 'high', concurrency: 10 }, pullNewTicketsJob);
	await agenda.define('CLOSE_TICKETS', { priority: 'high', concurrency: 10 }, closeTicketsJob);

	/* SCHEDULE JOBS */
	await agenda.every('1 minute', 'PULL_NEW_TICKETS');
	await agenda.every('1 minute', 'CLOSE_TICKETS');
}

main();
