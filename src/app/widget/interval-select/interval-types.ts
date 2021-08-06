export enum IntervalType {
    DAY = 1,
    WEEK = 7,
    MONTH = 31
}

export class DateModel {
    selectedOffset: number;
    fromDate: Date;
    toDate: Date;
    yesterdayDate: Date;
}

export enum Weekdays {
    SUNDAY,
    MONDAY,
    TUESDAY,
    WEDNESDAY,
    THURSDAY,
    FRIDAY,
    SATURDAY
}
