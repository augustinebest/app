const moment = require('moment');
const differenceInDays = require('date-fns/differenceInDays');
const differenceInWeeks = require('date-fns/differenceInWeeks');
const differenceInMonths = require('date-fns/differenceInMonths');

const _this = {
    // This function will strip
    changeDateTimezone: function(date, timezone) {
        if (typeof date === 'string') {
            date = new Date(date);
        }

        // eg. moment.tz("2013-11-18 11:55", "Asia/Taipei");
        return moment
            .tz(
                `${date.getFullYear()}-${date.getMonth() +
                    1}-${date.getDate()} ${date.getHours()}:${date.getMinutes()}`,
                timezone
            )
            .toDate();
    },

    compareDate: function(startTime, endTime, currentTime) {
        const isDifferentDay = startTime >= endTime;
        const [startHour, startMin] = startTime.split(':');
        const [endHour, endMin] = endTime.split(':');
        const [nowHour, nowMin] = currentTime.split(':');
        const addDay = 86400000;

        const start = new Date(
            new Date().setHours(startHour, startMin)
        ).getTime();
        const end = isDifferentDay
            ? new Date(
                  new Date(new Date().getTime() + addDay).setHours(
                      endHour,
                      endMin
                  )
              ).getTime()
            : new Date(
                  new Date(new Date().getTime()).setHours(endHour, endMin)
              ).getTime();
        let current = new Date(new Date().setHours(nowHour, nowMin)).getTime();

        current =
            current < start && isDifferentDay
                ? new Date(
                      new Date(new Date().getTime() + addDay).setHours(
                          nowHour,
                          nowMin
                      )
                  ).getTime()
                : current;

        if (current >= start && current <= end) return true;
        return false;
    },

    convertToTimezone: function(date, timezone) {
        if (typeof date === 'string') {
            date = new Date(date);
        }

        return moment(date)
            .tz(timezone)
            .toDate();
    },

    convertToCurrentTimezone: function(date) {
        if (typeof date === 'string') {
            date = new Date(date);
        }

        return moment(date)
            .tz(moment.tz.guess())
            .toDate();
    },

    format: function(date, formatString) {
        if (typeof date === 'string') {
            date = new Date(date);
        }

        return moment(date).format(formatString);
    },

    getCurrentTimezoneAbbr: function() {
        return moment.tz(moment.tz.guess()).zoneAbbr();
    },

    getCurrentTimezone: function() {
        return moment.tz.guess();
    },

    getDifferenceInMonths(date1, date2) {
        if (typeof date1 === 'string') {
            date1 = new Date(date1);
        }
        if (typeof date2 === 'string') {
            date2 = new Date(date2);
        }
        if (_this.greaterThan(date1, date2)) {
            return 0;
        }
        return differenceInMonths(date2, date1);
    },

    getDifferenceInDays(date1, date2) {
        if (typeof date1 === 'string') {
            date1 = new Date(date1);
        }
        if (typeof date2 === 'string') {
            date2 = new Date(date2);
        }
        if (_this.greaterThan(date1, date2)) {
            return 0;
        }
        return differenceInDays(date2, date1);
    },

    getDifferenceInWeeks(date1, date2) {
        if (typeof date1 === 'string') {
            date1 = new Date(date1);
        }
        if (typeof date2 === 'string') {
            date2 = new Date(date2);
        }
        if (_this.greaterThan(date1, date2)) {
            return 0;
        }
        return differenceInWeeks(date2, date1);
    },

    greaterThan(date1, date2) {
        if (typeof date1 === 'string') {
            date1 = new Date(date1);
        }
        if (typeof date2 === 'string') {
            date2 = new Date(date2);
        }
        return date1.getTime() > date2.getTime();
    },

    lessThan(date1, date2) {
        if (typeof date1 === 'string') {
            date1 = new Date(date1);
        }
        if (typeof date2 === 'string') {
            date2 = new Date(date2);
        }
        return date1.getTime() < date2.getTime();
    },

    isInBetween(date, startDate, endDate) {
        if (typeof date === 'string') {
            date = new Date(date);
        }

        if (typeof startDate === 'string') {
            startDate = new Date(startDate);
        }

        if (typeof endDate === 'string') {
            endDate = new Date(endDate);
        }

        if (
            _this.greaterThan(startDate, date) &&
            _this.lessThan(date, endDate)
        ) {
            return true;
        }

        return false;
    },

    equalTo(date1, date2) {
        if (typeof date1 === 'string') {
            date1 = new Date(date1);
        }
        if (typeof date2 === 'string') {
            date2 = new Date(date2);
        }
        return date1.getTime() === date2.getTime();
    },

    notEqualTo(date1, date2) {
        if (typeof date1 === 'string') {
            date1 = new Date(date1);
        }
        if (typeof date2 === 'string') {
            date2 = new Date(date2);
        }

        return date1.getTime() !== date2.getTime();
    },

    //This will change the date to today and will retain the time.
    moveDateToToday(date) {
        const today = new Date();

        if (typeof date === 'string') {
            date = new Date(date);
        }

        return moment
            .tz(
                `${today.getFullYear()}-${today.getMonth() +
                    1}-${today.getDate()} ${date.getHours()}:${date.getMinutes()}`,
                _this.getCurrentTimezone()
            )
            .toDate();
    },

    isOlderThanLastMinute(date) {
        if (typeof date === 'string') {
            date = new Date(date);
        }

        const current = new Date();
        date = moment(date)
            .add(1, 'minutes')
            .toDate();

        return _this.lessThan(date, current);
    },

    getCurrentYear: () => {
        return new Date().getFullYear();
    },
};

module.exports = _this;
