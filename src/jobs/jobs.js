import { ApiClient } from '../apiClient.js';
const log_time = new Date().toISOString();
const page = process.env.PAGE_SIZE || 10;

export async function pullNewOrdersJob(job) {
	const jobName = job.attrs.name;
	const ordersIds = [];

	console.log(`time= ${log_time}, action= ${jobName}, status= started`);

	try {
		const venues = await ApiClient().getVenues({ features: ['vemospay'] });

		for (let i = 0; i < venues.length; i += page) {
			const venuesForPull = venues.slice(i, i + page);
			const ids = await processPull(venuesForPull);
			ordersIds.push(...ids);
		}

		console.log(`>>> time= ${log_time}, action= ${jobName}, status= success, response= ${JSON.stringify(ordersIds)}`);
	} catch (error) {
		console.error(`XX time= ${log_time}, action= ${jobName}, status= error, message= ${error.message}`);
	}
}

export async function syncOrdersJob(job) {
	const jobName = job.attrs.name;

	console.log(`time= ${log_time}, action= ${jobName}, status= started`);
	try {
		const ordersOpen = await ApiClient().getOpenOrders();

		const orderRes = await paginateSyncOrders(ordersOpen);

		console.log(`>>> time= ${log_time}, action= ${jobName}, status= success, response= ${JSON.stringify(orderRes)}`);
	} catch (error) {
		console.error(`XX time=${log_time}, action=${jobName}, status=error, message=${error.message}`);
	}
}

export async function closeVenueJob(job) {
	const jobName = job.attrs.name;
	const venueId = job.attrs.data.venueId;

	console.log(`time= ${log_time}, action= ${jobName}, status= started`);
	try {
		const orderRes = await ApiClient().closeOrders(venueId);
		console.log(`>>> time= ${log_time}, action= ${jobName}, status= success, response = ${JSON.stringify(orderRes)}`);
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
				.syncOrders(order._id)
				.catch((err) => {
					console.error(`Error syncing order ${order._id}: ${err.message}`);
					return null;
				})
		)
	);

	return ordersSync.filter((order) => order !== null).map((order) => order._id);
}

async function processPull(venues) {
	const ordersForVenues = await Promise.all(
		venues.map(async (venue) =>
			ApiClient()
				.pullNewOrders(venue.id)
				.catch((err) => null)
		)
	);

	return ordersForVenues
		.filter((order) => order !== null)
		.map((order) => order.orderIds)
		.flat();
}
