import dayjs from 'dayjs';

import { PullOrderModel } from '../models/pullOrders.model.js';
import { FEATURES, POS_TYPES } from '../common/constants.js';
import { logger } from '../common/logger.js';
import { ApiClient } from '../apiClient.js';

const log_time = new Date().toISOString();
const page = process.env.PAGE_SIZE || 10;

/*********************************** public functions ***********************************/
export async function pullNewOrdersJob(job) {
	const jobName = job.attrs.name;
	const ordersIds = [];

	logger.info(`time= ${log_time}, action= ${jobName}, status= started`);

	try {
		const allVenues = await ApiClient().getVenues({ features: FEATURES });

		// Remove Toast venues
		const venues = allVenues.filter((venue) => venue?.posType != POS_TYPES.TOAST);

		//Separate clover venues to process them separately
		const cloverVenues = venues.filter((order) => order.posType === POS_TYPES.CLOVER);
		const otherVenues = venues.filter((order) => order.posType !== POS_TYPES.CLOVER);

		// Pull orders in batches of 10
		for (let i = 0; i < otherVenues.length; i += page) {
			const venuesForPull = otherVenues.slice(i, i + page);
			const ids = await _processPull(venuesForPull);
			ordersIds.push(...ids);
		}

		// Pull clover orders
		const ids = await _processEventsByClover(cloverVenues, _processPull);

		// Concatenate the results
		const orderRes = [...ordersIds, ...ids];

		logger.info(`>>> time= ${log_time}, action= ${jobName}, status= success, response= ${JSON.stringify(orderRes)}`);
	} catch (error) {
		logger.error(`XX time= ${log_time}, action= ${jobName}, status= error, message= ${error.message}`);
	}
}

export async function syncOrdersJob(job) {
	const jobName = job.attrs.name;

	logger.info(`time= ${log_time}, action= ${jobName}, status= started`);
	try {
		const ordersIds = [];
		const ordersOpen = await ApiClient().getOpenOrders();

		// Remove Toast orders
		const orders = ordersOpen.filter((order) => order.posType != POS_TYPES.TOAST);

		//Separate clover orders to process them separately
		const cloverOrders = orders.filter((order) => order.posType === POS_TYPES.CLOVER);
		const otherOrders = orders.filter((order) => order.posType !== POS_TYPES.CLOVER);

		// Sync orders in batches of 10
		for (let i = 0; i < otherOrders.length; i += page) {
			const ordersToSync = otherOrders.slice(i, i + page);
			const ids = await _processSync(ordersToSync);
			ordersIds.push(...ids);
		}

		// Sync clover orders
		const ids = await _processEventsByClover(cloverOrders, _processSync);

		// Concatenate the results
		const orderRes = [...ordersIds, ...ids];

		logger.info(`>>> time= ${log_time}, action= ${jobName}, status= success, response= ${JSON.stringify(orderRes)}`);
	} catch (error) {
		logger.error(`XX time=${log_time}, action=${jobName}, status=error, message=${error.message}`);
	}
}

export async function closeVenueJob(job) {
	const jobName = job.attrs.name;
	const venueId = job.attrs.data.venueId;

	logger.info(`time= ${log_time}, action= ${jobName}, status= started`);
	try {
		const orderRes = await ApiClient().closeOrders(venueId);
		logger.info(`>>> time= ${log_time}, action= ${jobName}, status= success, response = ${JSON.stringify(orderRes)}`);
	} catch (error) {
		logger.error(`XX time= ${log_time}, action= ${jobName}, status= error, message= ${error.message}`);
	}
}

/*********************************** private functions ***********************************/
// Retrieves the last pull date for a venue
async function _getLastPullDateByVenue(venueId) {
	const lastPullOrder = await PullOrderModel.findOne({ venueId });
	if (!lastPullOrder) throw Error('Last Pull Order Not Found');
	return lastPullOrder.toJSON();
}

// Saves the last pull date for a venue
async function _saveLastPullDateByVenue(venueId) {
	const pullOrder = await PullOrderModel.findOneAndUpdate({ venueId }, { venueId }, { upsert: true, new: true });
	return pullOrder;
}

// Iterates over the array of orders and synchronizes them with the PoS system
async function _processSync(orders) {
	const ordersSync = await Promise.all(
		orders.map((order) =>
			ApiClient()
				.syncOrders(order._id)
				.catch((err) => {
					logger.error(`Error syncing order ${order._id}: ${err.message}`);
					return null;
				})
		)
	);

	return ordersSync.filter((order) => order !== null).map((order) => order._id);
}

// Pulls new orders from the PoS system
async function _processPull(venues) {
	const ordersForVenues = await Promise.all(
		venues.map(async (venue) => {
			let lastXMinutes = 5;

			const lastPull = await _getLastPullDateByVenue(venue.id).catch(() => null);

			if (lastPull) lastXMinutes = dayjs().diff(dayjs(lastPull.updatedAt), 'minutes');

			const data = await ApiClient()
				.pullNewOrders(venue.id, lastXMinutes)
				.catch((err) => null);

			if (!data) return null;

			await _saveLastPullDateByVenue(venue.id);

			return data;
		})
	);

	return ordersForVenues
		.filter((order) => order !== null)
		.map((order) => order.orderIds)
		.flat();
}

// Processes events for Clover places, receives a callback to process the events.
async function _processEventsByClover(events, callback) {
	const ordersIds = [];
	for (let i = 0; i < events.length; i += 3) {
		const eventsToProcess = events.slice(i, i + 3);
		const ids = await callback(eventsToProcess);
		ordersIds.push(...ids);
	}

	return ordersIds;
}
