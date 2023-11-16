import { createVemospayApi_v2 } from '../apiClients/vemospayApiV2.js';

export async function syncTicketsJob(job) {
	// Retrieve the job name from the job object
	const jobName = job.attrs.name;

	console.log(`time=${new Date().toISOString()} action=${jobName} status=started`);
	try {
		const ticketRes = await createVemospayApi_v2().syncTickets('open');
		console.log(`>> time=${new Date().toISOString()} action=${jobName} status=success`, JSON.stringify(ticketRes));
	} catch (error) {
		console.error(`<< time=${new Date().toISOString()} action=${jobName} status=error`, JSON.stringify(error));
	}
}
