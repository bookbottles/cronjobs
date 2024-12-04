import { ApiClient } from '../apiClient';

export function createTasks(apiClient: ApiClient) {
	export async function syncOpenOrders() {
		// const page = config.pageSize;
		// const jobName = job.attrs.name;

		// try {
		const ordersIds = [];
		const orders = await apiClient.getOrders({ status: 'open' });

		// Remove venues that are not processed
		const orders = ordersOpen.filter((order) => !venueNotProcessed.includes(order?.posType));

		// Sync orders in batches of 10
		for (let i = 0; i < orders.length; i += page) {
			const ordersToSync = orders.slice(i, i + page);
			const ids = await _processSync(ordersToSync);
			ordersIds.push(...ids);
		}

		if (config.nodeEnv === 'dev') {
			//Separate clover orders to process them separately
			const cloverOrders = orders.filter((order) => order.posType === POS_TYPES.CLOVER);

			// Sync clover orders
			const ids = await _processEventsByClover(cloverOrders, _processSync);

			ordersIds.push(...ids);
		}

		// 	logger.info(`>>> time= ${log_time}, action= ${jobName}, status= success, response= ${JSON.stringify(ordersIds)}`);
		// } catch (error) {
		// 	logger.error(`XX time=${log_time}, action=${jobName}, status=error, message=${error.message}`);
		// }
	}

	return { syncOpenOrders };
}
