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
	const days = venue.hours.days || {};
	const tz = venue.hours.timezone || 'US/Central';
	const now = dayjs().tz(tz);

	if (now.hour() < 12) {
		// if now is before noon it should be yesterday's closing time since it's after midnight
		const yesterday = now.subtract(1, 'day');
		const venueYesterday = days[yesterday.format('ddd').toLowerCase()];
		if (!venueYesterday) return null;

		const [hYest, mYest] = venueYesterday.close.split(':');
		const yesterdayClose = yesterday.set('hour', Number(hYest)).set('minute', Number(mYest));

		if (Number(hYest) < 12) return yesterdayClose.add(1, 'day');

		return yesterdayClose;
	} else {
		// if now is after noon, it should be either today's closing time or tomorrow's closing time
		const venueToday = days[now.format('ddd').toLowerCase()];
		if (!venueToday) return null;

		const [hToday, mToday] = venueToday.close.split(':');
		const todayClose = now.set('hour', Number(hToday)).set('minute', Number(mToday));

		if (Number(hToday) < 12) return todayClose.add(1, 'day');

		return todayClose;
	}
}
