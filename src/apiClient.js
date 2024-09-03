import axios from 'axios';

export function ApiClient() {
	const BASE_URL = process.env.CRONJOBS_API;
	const API_KEY = process.env.CRONJOBS_API_KEY;

	const commonHeaders = {
		'Content-Type': 'application/json',
		'x-api-key': API_KEY
	};

	const client = axios.create({
		baseURL: BASE_URL,
		timeout: 60000 /* 1 minute */,
		headers: commonHeaders
	});

	async function pullNewTickets(venueId) {
		const { data } = await client.post(`/orders/pull`, { venueId });
		return data;
	}

	async function closeTickets(venueId) {
		const { data } = await client.post(`/orders/close`, { venueId });
		return data;
	}

	async function getVenues(filter = {}) {
		let params = {};
		if (filter) {
			params = new URLSearchParams();

			filter?.features.forEach((feature) => {
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

	async function syncTickets(orderId) {
		const { data } = await client.post(`/orders/sync`, { orderId });
		return data;
	}

	return { closeTickets, pullNewTickets, syncTickets, getVenues, getOpenOrders };
}
