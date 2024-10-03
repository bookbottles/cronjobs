import axios from 'axios';

import { config } from './common/config.js';

export function ApiClient() {
	const BASE_URL = config.cronjob.baseUrl;
	const API_KEY = config.cronjob.apiKey;

	const commonHeaders = {
		'Content-Type': 'application/json',
		'x-api-key': API_KEY
	};

	const client = axios.create({
		baseURL: BASE_URL,
		timeout: 60000 /* 1 minute */,
		headers: commonHeaders
	});

	async function pullNewOrders(venueId, lastXMinutes = 5) {
		const { data } = await client.post(`/orders/pull`, { venueId, lastXMinutes });
		return data;
	}

	async function closeOrders(venueId) {
		const { data } = await client.post(`/orders/close`, { venueId });
		return data;
	}

	async function getVenues(filter = {}) {
		let params = {};
		if (filter) {
			params = new URLSearchParams();

			filter?.features?.forEach((feature) => {
				params.append('features', feature);
			});
		}

		const { data } = await client.get(`/venues`, { params });
		return data;
	}

	async function getOpenOrders() {
		const { data } = await client.get(`/orders/open`);
		return data;
	}

	async function syncOrders(orderId) {
		const { data } = await client.post(`/orders/sync`, { orderId });
		return data;
	}

	return { closeOrders, pullNewOrders, syncOrders, getVenues, getOpenOrders };
}
