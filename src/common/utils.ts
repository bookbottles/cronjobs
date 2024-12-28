import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc.js';
import timezone from 'dayjs/plugin/timezone.js';
import localeData from 'dayjs/plugin/localeData.js';
import customParseFormat from 'dayjs/plugin/customParseFormat.js';

import { Venue } from '../types';

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(customParseFormat);
dayjs.extend(localeData);

export function getClosingTime(venue: Venue) {
	const tz = venue.hours?.timezone || 'US/Central';

	const today = dayjs().tz(tz);
	const venueToday = (venue.hours?.days || {})[today.format('ddd').toLowerCase()];

	if (!venueToday?.close) throw new Error(`Venue ${venue.id} hasn't defined hours for today`);
	if (!venueToday?.isOpen) throw new Error(`Venue ${venue.id} is not open today`);

	/* assume format is hhmm 24h */
	let closeHours = Number(venueToday.close.split(':')[0]);
	const closeMinutes = Number(venueToday.close.split(':')[1]);
	const openHours = venueToday.open ? Number(venueToday.open.split(':')[0]) : 14; // default to 2pm

	let closeDate = today.startOf('day').add(closeHours, 'hours').add(closeMinutes, 'minutes');

	// if closes next day
	if (closeHours < openHours) closeDate = closeDate.add(1, 'day');

	if (!closeDate.isValid()) throw new Error(`Invalid close date for venue ${venue.id}`);

	return closeDate.toDate();
}
