import dayjs from 'dayjs';
import _ from 'lodash';

import { getClosingTime } from '../common/utils';
import { PullOrderModel } from '../models';
import { ApiClient } from '../apiClient';
import { config } from '../common';
import { Order, Venue } from '../types';

export interface Tasks {
	syncOrders: () => Promise<any>;
	pullPosOrders: () => Promise<any>;
	closeVenues: () => Promise<any>;
}

const excludedPOS = config.excludedSyncPOS;

export function createTasks(apiClient: ApiClient): Tasks {
	async function syncOrders() {
		try {
			const batchSize = 10; // TODO: Move to config
			const syncedIds: string[] = [];

			const openOrders = await apiClient.getOrders({ statusList: 'open' });
			// Some pos types have an active webhook that syncs orders in real-time, we should exclude them
			const orders = openOrders.filter((o) => !excludedPOS.includes(o?.posType));

			// Sync orders in batches to avoid hitting the rate limit
			for (let i = 0; i < orders.length; i += batchSize) {
				const ordersToSync = orders.slice(i, i + batchSize);

				const synced = await Promise.all(ordersToSync.map((o) => apiClient.syncOrder(o).catch(() => null)));

				const ids = synced.map((o) => o?._id);
				syncedIds.push(...ids);
			}

			return syncedIds;
		} catch (err: any) {
			console.log(`task error: syncOrders ::`, err);
		}
	}

	async function pullPosOrders() {
		try {
			let newOrders: string[] = [];
			const batchSize = 10; // TODO: Move to config
			const minutesAgo = 5; // TODO: Move to config

			const allVenues = await apiClient.getVenues({ features: ['vemospay'] });
			const venues = allVenues.filter((v) => !excludedPOS.includes(v?.posType));

			// Pull orders in batches to avoid hitting the rate limit
			for (let i = 0; i < venues.length; i += batchSize) {
				const batch = venues.slice(i, i + batchSize);
				const res = await Promise.all(batch.map((v) => _pullVenueOrders(v, minutesAgo).catch(() => null)));
				newOrders.push(...res.flat());
			}

			return newOrders;
		} catch (err: any) {
			console.log(`task error: pullPosOrders ::`, err);
		}
	}

	async function closeVenues() {
		try {
			/* 1. Get open orders */
			const openOrders = await apiClient.getOrders({ statusList: 'open' });
			if (!openOrders?.length) return;

			/* 2. Group orders by venue */
			const venueOrders = _.groupBy(openOrders, 'venueId');
			const ids = Object.keys(venueOrders);

			/* 3. Get venues */
			const venues = await apiClient.getVenues({ ids });

			/* 4. Check closing time for each venue */
			for (const venue of venues) {
				const closingTime = getClosingTime(venue);
				if (!closingTime) {
					console.log(`⚠️ Closing time not found for venue ${venue.id} - ${venue.name}`);
					continue;
				}

				const now = dayjs();
				const tz = venue.hours.timezone;

				/* close venues that closed in a 15 minutes ago range */
				const diff = closingTime.diff(now, 'minutes');
				if (diff >= -15 && diff < 0) {
					const orders = venueOrders[venue.id];
					if (!orders?.length) {
						/* we still don't know why this happens but sometimes we get venues with no open orders */
						console.log(
							`⚠️ No open orders for venue ${venue.id} - ${venue.name}, venues length: ${venues.length} and ids length: ${ids.length}`
						);
						continue;
					}

					console.log(
						`⏳ Closing ${orders?.length} orders venue ${venue.id} - ${venue.name} at ${now.tz(tz).format('HH:mm')} ${
							venue.hours.timezone
						}`
					);

					await closeOrdersBatchSync(orders);

					console.log(`✅ Closed ${orders?.length} orders for venue ${venue.id} - ${venue.name}`);
				}
			}
		} catch (err) {
			console.log(`task error: closeVenues ::`, err);
		}
	}

	async function closeOrdersBatchSync(orders: Order[]) {
		for (const order of orders) {
			await apiClient.closeOrder(order._id).catch((err) => console.error('closeOrder error', err));
		}
	}

	/**** helper functions ****/
	async function _pullVenueOrders(venue: Venue, minutesAgo: number) {
		const lastPull = await _getLastPullDate(venue.id).catch(() => null);
		if (lastPull) minutesAgo = dayjs().diff(dayjs(lastPull.updatedAt), 'minutes');

		const data = await apiClient.pullNewOrders(venue.id, minutesAgo);
		await _updateLastPullDate(venue.id);
		return data;
	}

	// Retrieves the last pull date for a venue
	async function _getLastPullDate(venueId: string) {
		const lastPullOrder = await PullOrderModel.findOne({ venueId });
		if (!lastPullOrder) throw Error('Last Pull Order Not Found');
		return lastPullOrder.toJSON();
	}

	// Saves the last pull date for a venue
	async function _updateLastPullDate(venueId: string) {
		const pullOrder = await PullOrderModel.findOneAndUpdate({ venueId }, { venueId }, { upsert: true, new: true });
		return pullOrder;
	}

	return { syncOrders, pullPosOrders, closeVenues };
}
