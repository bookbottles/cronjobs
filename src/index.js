import Agenda from 'agenda';
import dotenv from 'dotenv';
import { syncTicketsJob, pullNewTicketsJob } from './jobs/vemospay.js';
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
	console.log('DB connected!');

	console.log('Starting agenda...');
	await agenda.start();
	console.log('Agenda started!');

	console.log('Defining jobs...');
	/* Sync existing tickets */
	await agenda.define('SYNC_TICKETS', { priority: 'high', concurrency: 10 }, syncTicketsJob);
	await agenda.every('1 minute', 'SYNC_TICKETS');

	/* Pull new tickets */
	await agenda.define('PULL_NEW_TICKETS', { priority: 'high', concurrency: 10 }, pullNewTicketsJob);
	await agenda.every('1 minute', 'PULL_NEW_TICKETS');
	console.log('Jobs defined!');
}

main();
