import { ApiClient } from '../apiClient.js';
const log_time = new Date().toISOString();

export async function pullNewTicketsJob(job) {
	const jobName = job.attrs.name;

	console.log(`time= ${log_time}, action= ${jobName}, status= started`);
	try {
		const ticketRes = await ApiClient().pullNewTickets();

		console.log(`>>> time= ${log_time}, action= ${jobName}, status= success, response= ${JSON.stringify(ticketRes)}`);
	} catch (error) {
		console.error(`XX time= ${log_time}, action= ${jobName}, status= error, message= ${error.message}`);
	}
}

export async function syncTicketsJob(job) {
	const jobName = job.attrs.name;

	console.log(`time= ${log_time}, action= ${jobName}, status= started`);
	try {
		const ordersOpen = await ApiClient().getOpenOrders();

		const ticketRes = await paginateSyncOrders(ordersOpen);

		console.log(`>>> time= ${log_time}, action= ${jobName}, status= success, response= ${JSON.stringify(ticketRes)}`);
	} catch (error) {
		console.error(`XX time=${log_time}, action=${jobName}, status=error, message=${error.message}`);
	}
}

export async function closeVenueJob(job) {
	const jobName = job.attrs.name;
	const venueId = job.attrs.data.venueId;

	console.log(`time= ${log_time}, action= ${jobName}, status= started`);
	try {
		const ticketRes = await ApiClient().closeTickets(venueId);
		console.log(`>>> time= ${log_time}, action= ${jobName}, status= success, response = ${JSON.stringify(ticketRes)}`);
	} catch (error) {
		console.error(`XX time= ${log_time}, action= ${jobName}, status= error, message= ${error.message}`);
	}
}

// Paginates the orders array and synchronizes them with the PoS system
async function paginateSyncOrders(orders, page = 15) {
	const ordersIds = [];

	for (let i = 0; i < orders.length; i += page) {
		const ordersToSync = orders.slice(i, i + page);
		const ids = await processSync(ordersToSync);
		ordersIds.push(...ids);
	}

	return ordersIds;
}

// Iterates over the array of orders and synchronizes them with the PoS system
async function processSync(orders) {
	const ordersSync = await Promise.all(
		orders.map((order) =>
			ApiClient()
				.syncTickets(order._id)
				.catch((err) => {
					console.error(`Error syncing order ${order._id}: ${err.message}`);
					return null;
				})
		)
	);

	// Use the type predicate to filter out null values
	return ordersSync.filter((order) => order !== null).map((order) => order._id);
}