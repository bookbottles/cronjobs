import dayjs from 'dayjs';

import { PullOrderModel } from '../models';
import { ApiClient } from '../apiClient';
import { config } from '../common';
import { Venue } from '../types';

export interface Tasks {
	syncOrders: () => Promise<any>;
	pullPosOrders: () => Promise<any>;
	closeVenue: (venueId: string) => Promise<any>;
}

const excludedPOS = config.excludedSyncPOS;

export function createTasks(apiClient: ApiClient): Tasks {
	async function syncOrders() {
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
	}

	async function pullPosOrders() {
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
	}

	async function closeVenue(venueId: string) {
		/* 1. Pay and close all open orders on the venue */
		const openOrders = await apiClient.getOrders({ statusList: 'open', venueIds: [venueId] });
		let closeOrders = [];
		for (const order of openOrders) {
			const res = await apiClient.closeOrder(order._id).catch(() => null);
			if (res) closeOrders.push(order._id);
		}

		return closeOrders;
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

	return { syncOrders, pullPosOrders, closeVenue };
}
