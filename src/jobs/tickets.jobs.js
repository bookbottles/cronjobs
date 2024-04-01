import { ApiClient } from '../apiClient.js';

export async function pullNewTicketsJob(job) {
	const jobName = job.attrs.name;

	console.log(`time=${new Date().toISOString()} action=${jobName} status=started`);
	try {
		const ticketRes = await ApiClient().pullNewTickets();
		console.log(`>>> time=${new Date().toISOString()} action=${jobName} status=success`, JSON.stringify(ticketRes));
	} catch (error) {
		console.error(`XX time=${new Date().toISOString()} action=${jobName} status=error`, JSON.stringify(error));
	}
}

export async function syncTicketsJob(job) {
	const jobName = job.attrs.name;

	console.log(`time=${new Date().toISOString()} action=${jobName} status=started`);
	try {
		const ticketRes = await ApiClient().syncExistingTickets();
		console.log(`>>> time=${new Date().toISOString()} action=${jobName} status=success`, JSON.stringify(ticketRes));
	} catch (error) {
		console.error(`XX time=${new Date().toISOString()} action=${jobName} status=error`, JSON.stringify(error));
	}
}

export async function closeTicketsJob(job) {
	// Retrieve the job name from the job object
	const jobName = job.attrs.name;

	console.log(`time=${new Date().toISOString()} action=${jobName} status=started`);
	try {
		const ticketRes = await ApiClient().closeTickets();
		console.log(`>>> time=${new Date().toISOString()} action=${jobName} status=success`, JSON.stringify(ticketRes));
	} catch (error) {
		console.error(`XX time=${new Date().toISOString()} action=${jobName} status=error`, JSON.stringify(error));
	}
}
