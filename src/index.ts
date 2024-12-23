import Mongoose from 'mongoose';
import express from 'express';
import Agendash from 'agendash';

import { config } from './common';
import { createTasks } from './tasks';
import { ApiClient } from './apiClient';
import { scheduleTasks } from './schedulers';

async function main() {
	const mongoose = await Mongoose.connect(config.mongoUrl, {
		serverSelectionTimeoutMS: 5000,
		socketTimeoutMS: 45000
	});

	const apiClient = ApiClient(config);
	const tasks = createTasks(apiClient);

	const scheduler = await scheduleTasks(tasks, apiClient);
	setupAPI(scheduler);
	console.log(`Initialized successfully! - Server time: ${new Date()}`);
}

/* Health check endpoint required by heroku */
async function setupAPI(agenda: any) {
	const app = express();

	app.get('/', (req, res) => {
		res.send('App is running!');
	});

	// setup ui for agenda scheduler
	agenda._collection = agenda.db.collection;
	app.use('/dash', Agendash(agenda));

	const PORT = config.nodePort || 3000;
	console.log(`Listening on port ${PORT}`);
	app.listen(PORT);
}

main().catch(console.error);
