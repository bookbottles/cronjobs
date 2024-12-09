import Mongoose from 'mongoose';
import express from 'express';
import { config } from './common';
import { createTasks } from './tasks';
import { ApiClient } from './apiClient';
import { scheduleTasks } from './schedulers';

async function main() {
	const mongoose = await Mongoose.connect(config.mongoUrl, {
		serverSelectionTimeoutMS: 5000,
		socketTimeoutMS: 45000
	});

	const mongo = mongoose.connection.getClient();

	const apiClient = ApiClient(config);
	const tasks = createTasks(apiClient);

	setupHealthCheck();
	await scheduleTasks(mongo, tasks, apiClient);
}

/* Health check endpoint required by heroku */
async function setupHealthCheck() {
	const app = express();
	app.get('/', (req, res) => {
		res.send('App is running!');
	});

	const PORT = config.nodePort || 3000;
	console.log(`Listening on port ${PORT}`);
	app.listen(PORT);
}

main().catch(console.error);
