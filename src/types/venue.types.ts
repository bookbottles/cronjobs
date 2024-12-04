export type Venue = {
	id: string;
	extId: string;
	name: string;
	posType: string;
	features: string[] /* list of enabled features: ['idscan', 'vemospay'] */;
	location: VenueLocation;
	logo?: VenueLogo;
	hours?: VenueHours;
};

type VenueLocation = {
	address?: string;
	city?: string;
	country?: string;
	postal?: string;
	state?: string;
	address2?: string;
	lat?: string;
	lng?: string;
	distance?: number;
};

type VenueLogo = {
	time?: number;
	url?: string;
	user?: string;
};

type VenueHours = {
	cutoff: VenueCutoff;
	days: { [key: string]: VenueDay };
	endOfNight: string;
	timezone: string;
};

type VenueCutoff = {
	guestlist: string;
	reservation: string;
};

type VenueDay = {
	close: string;
	isOpen: boolean;
	open: string;
};

export type VenuesFilter = {
	features?: string[];
};
