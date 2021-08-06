export const ChartTypes = {
    DISTANCE: {
        valueFix: (val: number) => val.toFixed(1),
        fieldSuffix: 'Distance',
        unit: ' km',
        percentageSuffix: ''
    },
    TIME: {
        valueFix: (val: number) => val.toFixed(1),
        fieldSuffix: 'Time',
        unit: null,
        percentageSuffix: ''
    },
    DISTANCE_PERCENTAGE: {
        valueFix: (val: number) => val.toFixed(1),
        fieldSuffix: 'Distance',
        unit: ' km',
        percentageSuffix: 'Percentage'
    },
    TIME_PERCENTAGE: {
        valueFix: (val: number) => val.toFixed(1),
        fieldSuffix: 'Time',
        unit: null,
        percentageSuffix: 'Percentage'
    }
};

export interface DataUnitModel {
    identifierName: string;
    id: number;
    driverPoints?: number;
    dateList: DateListItem[];
}

export class DateListItem {
    subList?: DateListItem[] = [];

    actualDate?: number; // on sub level
    identifierName?: string; // on top level
    id?: number; // on top level
    driverPoints?: number;

    officialTime = 0;
    officialDistance = 0;
    privateTime = 0;
    privateDistance = 0;
    idleTime = 0;
    drivingTime = 0;

    workingOfficialTime = 0;
    workingOfficialDistance = 0;
    workingPrivateTime = 0;
    workingPrivateDistance = 0;
    workingIdleTime = 0;
    workingDrivingTime = 0;

    // calculated locally, won't come from server
    sumDistance = 0;
    sumTime = 0;
    sumIgnitionTime = 0;

    sumWorkTime = 0;
    notWorkingIgnitionTime = 0;
    workingIgnitionTime = 0;

    officialDistancePercentage = 0;
    privateDistancePercentage = 0;
    officialTimePercentage = 0;
    privateTimePercentage = 0;
    idleTimePercentage = 0;
    drivingTimePercentage = 0;
    workingDrivingTimePercentage = 0;
    workingIgnitionTimePercentage = 0;
    notWorkingIgnitionTimePercentage = 0;
}

export class Report {
    fromTime: number;
    toTime: number;
    dateList: DateListItem[];
    itemList: DateListItem[] = [];
}

export class RequestModel {
    fromTime: number;
    toTime: number;

    constructor(obj?: any) {
        if (obj) {
            Object.keys(obj).forEach(key => {
                this[key] = obj[key];
            });
        }
    }
}
