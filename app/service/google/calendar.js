let app    = require('../../../index.js');
let axios  = require('axios');
let moment = require('moment');

module.exports = class GoogleCalendarApi {
	static getNextShow() {
		return new Promise(function(resolve, reject) {
			axios.get('https://www.googleapis.com/calendar/v3/calendars/bronyradiogermany%40gmail.com/events?timeMin=' + moment().add(15, 'minutes').toISOString() + '&key=' + app.config.google.apiKey)
				.then((response) => {
					var nextShow;
					let shows = response.data.items;

					if (shows.length === 0) {
						resolve(nextShow);
						return;
					}

					nextShow = GoogleCalendarApi.sortGoogleCalenderItems(shows)[0];

					resolve(nextShow);
				})
				.catch((error) => {
					console.error(error);
					reject(Error(error));
				})
		});
	}

	static sortGoogleCalenderItems (items) {
		return items.sort((a, b) => {
			var firstDate = new Date(a.start.dateTime)
			var secondDate = new Date(b.start.dateTime)

			if (firstDate < secondDate) {
				return -1
			} else if (firstDate > secondDate) {
				return 1
			} else {
				return 0
			}
		})
	}
}
