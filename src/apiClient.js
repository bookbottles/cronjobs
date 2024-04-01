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
		timeout: 45000,
		headers: commonHeaders
	});

	async function pullNewTickets() {
		const { data } = await client.post(`/tickets/pull`, {});
		return data;
	}

	async function syncExistingTickets() {
		const { data } = await client.post(`/tickets/sync`, {});
		return data;
	}

	async function closeTickets() {
		const { data } = await client.post(`/tickets/close`, {});
		return data;
	}

	return { closeTickets, pullNewTickets, syncExistingTickets };
}
