import Mongoose from 'mongoose';
import express from 'express';
import Agendash from 'agendash';

import { config } from './common';
import { createTasks } from './tasks';
import { ApiClient } from './apiClient';
import { scheduleTasks } from './schedulers';
import Agenda from 'agenda';

async function main() {
	const mongoose = await Mongoose.connect(config.mongoUrl, {
		serverSelectionTimeoutMS: 5000,
		socketTimeoutMS: 45000
	});

	const apiClient = ApiClient(config);
	const tasks = createTasks(apiClient);

	const scheduler = await scheduleTasks(tasks, apiClient);
	setupAPI(scheduler);
}

/* Health check endpoint required by heroku */
async function setupAPI(agenda: Agenda) {
	const app = express();

	app.get('/', (req, res) => {
		res.send('App is running!');
	});
	// setup ui for agenda scheduler
	app.use('/dash', Agendash(agenda));

	const PORT = config.nodePort || 3000;
	console.log(`Listening on port ${PORT}`);
	app.listen(PORT);
}

main().catch(console.error);
