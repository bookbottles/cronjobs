import axios from 'axios';

export function createVemospayApi_v2() {
	const BASE_URL = process.env.VEMOSPAY_API_V2_URL;
	const API_KEY = process.env.VEMOSPAY_API_V2_KEY;
	const V2_PATH = '/vemospay/v2';

	const commonHeaders = {
		'Content-Type': 'application/json',
		'x-api-key': API_KEY
	};

	const client = axios.create({
		baseURL: BASE_URL,
		timeout: 30000,
		headers: commonHeaders
	});

	async function syncTickets(targetStatus) {
		const { data } = await client.post(`${V2_PATH}/tickets/sync`, { targetStatus });
		return data;
	}

	return { syncTickets };
}
