export type OrderStatus = 'open' | 'closed' | 'voided' | 'deleted';
export type CheckStatus = 'open' | 'paid' | 'voided' | 'deleted';

/**
 * Order extends PosOrder with additional data we store in our database
 * */
export interface Order extends PosOrder {
	_id: string;
	venueId: string;
	checks: Check[];
	locationId?: string /* This represents the location where the items should be delivered to. This is not a Venue, this is a location within the venue */;
	closedBy: string; // 'user' | 'pos' | 'system';
	createdAt: string;
	updatedAt: string;
}

/**
 *  The Order data we collect from the Point of Sale API (e.g. Toast)
 */
export type PosOrder = {
	extId: string /* POS Service order id  */;
	restaurantExtId: string;
	posType: string /* POS Service name (e.g. toast, omnivore) */;
	status: OrderStatus;
	checks: PosCheck[];
	serverExtId?: string /* External id of the server who opened the Order */;
	table?: {
		extId: string /* External id of the table where the Order was opened */;
		name: string /* Table name */;
	};
	totals: PosOrderTotals;
};

/**
 * Check extends PosCheck with additional data we store in our database
 * */
export interface Check extends PosCheck {
	_id: string;
	id?: string;
	orderId: string;
	userId: string;
	parentId?: string /* In case of split check we create a new check with the same items and the parent check id is the original check id */;
	createdAt: string;
	updatedAt: string;
}

/**
 * The Check data we collect from the Point of Sale API (e.g. Toast)
 * */
export type PosCheck = {
	extId: string /* POS Service check id  (in case pos supports multiple checks per order, e.g. Toast) or orderExtId in case pos does not support multiple checks per order (e.g. Upserve) */;
	posType: string /* POS Service name (e.g. toast, omnivore) */;
	status: CheckStatus;
	appliedServiceCharges: {
		name: string;
		gratuity: boolean;
		amount: number;
	}[];
	payments: PaymentResult[];
	// items: PosItem[];
	totals: PosOrderTotals;
};

export interface PosOrderTotals {
	itemsPreDiscountTotal: number;
	itemsPostDiscountTotal: number;
	gratuity: number;
	taxes: number;
	serviceCharges: number;
	tips: number;
	totalDiscounts: number;
	subTotal: number;
	total: number;
	paid: number;
	due: number;
}

export type PaymentResult = {
	_id?: string;
	posTxId?: string; // pos id
	spreedlyTxId?: string;
	status?: string; // internal status: success, failed, voided, refunded
	posStatus?: string; // pos status response, varies by pos
	message?: string;
	cardId?: string;
	userId?: string;
	checkId?: string;
	orderId?: string;
	userName?: string;
	cardHolderName?: string;
	cardType: string;
	last4?: string;
	type: string;
	amount?: number;
	tip?: number;
	totalPaid?: number;
	payee?: string; // who received the payment (biz stripe account, venue stripe account, venue receiver)
	createAt?: Date;
	updateAt?: number;
};

export type PayOrderParams = {
	orderId: string;
	checkId?: string; // if specified, only this check will be paid, otherwise all checks will be paid
	amount?: number; // if not specified, the check due amount will be paid
	tip?: number; // if not specified, is 20% of the check subTotal
	cvv?: string; // clover requires cvv
	type?: 'force' | 'biz' | 'direct';
};
