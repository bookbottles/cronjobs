import axios from 'axios';
import { Order, PayOrderParams, Venue, VenuesFilter } from './types';

export interface ApiClient {
	getVenues: (filter: VenuesFilter) => Promise<Venue[]>;
	getOrders: (filter: any) => Promise<Order[]>;
	syncOrder: (order: Order) => Promise<Order>;
	closeOrder: (orderId: string) => Promise<void>;
	pullNewOrders: (venueId: string, lastXMinutes: number) => Promise<string[]>;
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

	async function getVenues(filter: VenuesFilter): Promise<Venue[]> {
		let params: any = {};
		if (filter) {
			params = new URLSearchParams();

			filter?.features?.forEach((feature) => {
				params.append('features', feature);
			});
		}

		const { data } = await client.get(`/venues`, { params });
		return data.venues;
	}

	async function getOrders(filter: any) {
		const { data } = await client.get(`/orders`, { params: filter });
		return data.orders;
	}

	async function pullNewOrders(venueId: string, lastXMinutes = 5) {
		const { data } = await client.post(`/orders/pull`, { venueId, lastXMinutes });
		return data.orderIds as string[];
	}

	async function closeOrder(orderId: string) {
		const { data } = await client.post(`/orders/close`, { orderId });
		return data;
	}

	async function syncOrder(order: Order) {
		const { data } = await client.post(`/orders/sync`, { orderId: order._id });
		return data;
	}

	async function systemPayOrder(params: PayOrderParams) {
		const { data } = await client.post(`/orders/pay`, params);
		return data;
	}

	return { getOrders, closeOrder, pullNewOrders, syncOrder, getVenues, systemPayOrder };
}
