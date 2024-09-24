import dayjs from 'dayjs';
import { ApiClient } from '../apiClient.js';
import { PullOrderModel } from '../models/pullOrders.model.js';
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
async function paginateSyncOrders(posOrders, page = 10) {
	const ordersIds = [];
	const orders = posOrders.filter((order) => order.posTypes != 'toast');

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
		venues
			.filter((venue) => venue?.posTypes != 'toast')
			.map(async (venue) => {
				let lastXMinutes = 5;

				const lastPull = await getLastPullDateByVenue(venue.id).catch(() => null);

				if (lastPull) lastXMinutes = dayjs().diff(dayjs(lastPull.updatedAt), 'minutes');

				const data = await ApiClient()
					.pullNewOrders(venue.id, lastXMinutes)
					.catch((err) => null);

				if (!data) return null;

				await saveLastPullDateByVenue(venue.id);

				return data;
			})
	);

	return ordersForVenues
		.filter((order) => order !== null)
		.map((order) => order.orderIds)
		.flat();
}

async function getLastPullDateByVenue(venueId) {
	const lastPullOrder = await PullOrderModel.findOne({ venueId });
	if (!lastPullOrder) throw Error('Last Pull Order Not Found');
	return lastPullOrder.toJSON();
}

async function saveLastPullDateByVenue(venueId) {
	const pullOrder = await PullOrderModel.findOneAndUpdate({ venueId }, { venueId }, { upsert: true, new: true });
	return pullOrder;
}
