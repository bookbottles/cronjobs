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

	async function pullNewTickets() {
		const { data } = await client.post(`/orders/pull`, {});
		return data;
	}

	async function syncExistingTickets() {
		const { data } = await client.post(`/orders/sync`, {});
		return data;
	}

	async function closeTickets(venueId) {
		const { data } = await client.post(`/orders/close`, { venueId });
		return data;
	}

	async function getVenues(filter = {}) {
		const { data } = await client.get(`/venues`, { params: filter });
		return data;
	}

	return { closeTickets, pullNewTickets, syncExistingTickets, getVenues };
}
