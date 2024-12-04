import axios from 'axios';
import { Order, PayOrderParams, Venue, VenuesFilter } from './types';

export interface ApiClient {
	getVenues: (filter: VenuesFilter) => Promise<Venue[]>;
	getOrders: (filter: any) => Promise<Order[]>;
	syncOrders: (orderId: string) => Promise<Order>;
	closeOrders: (venueId: string) => Promise<Order[]>;
	pullNewOrders: (venueId: string, lastXMinutes: number) => Promise<Order[]>;
	getOpenOrders: () => Promise<Order[]>;
	systemPayOrder: (params: PayOrderParams) => Promise<Order>;
}

export function ApiClient(config: any): ApiClient {
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

	async function getOrders(filter: any) {
		const { data } = await client.get(`/orders`, { params: filter });
		return data;
	}

	async function pullNewOrders(venueId: string, lastXMinutes = 5) {
		const { data } = await client.post(`/orders/pull`, { venueId, lastXMinutes });
		return data;
	}

	async function closeOrders(venueId: string) {
		const { data } = await client.post(`/orders/close`, { venueId });
		return data;
	}

	async function getVenues(filter: VenuesFilter): Promise<Venue[]> {
		let params: any = {};
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

	async function syncOrders(orderId: string) {
		const { data } = await client.post(`/orders/sync`, { orderId });
		return data;
	}

	async function systemPayOrder(params: PayOrderParams) {
		const { data } = await client.post(`/orders/pay`, params);
		return data;
	}

	return { closeOrders, pullNewOrders, syncOrders, getVenues, getOpenOrders, systemPayOrder };
}
