import { Injectable, OnDestroy } from '@angular/core';
import { Settings } from '../settings/settings';
import { Subject, BehaviorSubject, Subscription } from 'rxjs';
import { RequestModel, DataUnitModel, Report, DateListItem, ChartTypes } from '../vehicle-view/vehicle-reports/report';
import { TranslateService } from '@ngx-translate/core';
import { Unsubscribe } from '../util/unsubscribe';
import { Weekdays } from '../widget/interval-select/interval-types';
import { AuthService } from '../auth/auth.service';

@Injectable()
@Unsubscribe()
export class StatisticService implements OnDestroy {
    readonly oneDayTime = 86400000;
    private requestModel: RequestModel = new RequestModel();
    private previousRequestModel: RequestModel = new RequestModel();
    private fleetDataFromServer: DataUnitModel[] = [];
    private driversDataFromServer: DataUnitModel[] = [];
    private vehicleWorktime = 0;
    private fleetReport: Report;
    private driversReport: Report;
    readonly fleetReportObservable: Subject<Report> = new BehaviorSubject<Report>(null);
    readonly requestModelObservable: Subject<RequestModel> = new BehaviorSubject<RequestModel>(null);
    readonly driversReportObservable: Subject<Report> = new BehaviorSubject<Report>(null);
    private userLoadSubscription: Subscription;

    constructor(private translateService: TranslateService,
                private authService: AuthService) {
        const hourUnit = ' ' + this.translateService.instant('REPORT.HOUR');
        ChartTypes.TIME.unit = hourUnit;
        ChartTypes.TIME_PERCENTAGE.unit = hourUnit;
        this.userLoadSubscription = this.authService.userLoad.subscribe(_ => {
            this.getReport();
        });
        this.authService.onLogout.subscribe(_ => this.empty());
    }

    private empty(): void {
        this.fleetReport = undefined;
        this.driversReport = undefined;
        this.fleetReportObservable.next(this.fleetReport);
        this.driversReportObservable.next(this.driversReport);
        this.requestModelObservable.next(undefined);
    }

    ngOnDestroy() {}

    private createReport(dataFromServer: DataUnitModel[]): Report {
        const report = new Report();
        report.fromTime = this.requestModel.fromTime;
        report.toTime = this.requestModel.toTime;
        report.dateList = this.initDateList(dataFromServer);
        if (report.dateList.length === 0) {
            return report;
        }
        dataFromServer.forEach(itemData => {
            const dateListItem = new DateListItem();
            dateListItem.identifierName = itemData.identifierName;
            dateListItem.id = itemData.id;
            dateListItem.driverPoints = itemData.driverPoints;
            dateListItem.sumWorkTime = this.vehicleWorktime;

            const hashedReportDateList: {[key: number]: DateListItem} = {};
            itemData.dateList.forEach(item => hashedReportDateList[item.actualDate] = item);
            for (let i = 0; i < report.dateList.length; i++) {
                const fleetVehicleDateItem = report.dateList[i];
                const serverVehicleDateItem = hashedReportDateList[fleetVehicleDateItem.actualDate];
                if (serverVehicleDateItem) {
                    serverVehicleDateItem.sumWorkTime = fleetVehicleDateItem.sumWorkTime;
                    this.addServerData(serverVehicleDateItem, dateListItem);
                    this.addServerData(serverVehicleDateItem, fleetVehicleDateItem);
                } else {
                    const tmp = new DateListItem();
                    tmp.actualDate = fleetVehicleDateItem.actualDate;
                    dateListItem.subList.push(tmp);
                }
            }
            this.calcFinalExtras(dateListItem);
            report.itemList.push(dateListItem);
        });

        report.dateList.forEach(item => {
            item.sumWorkTime *= dataFromServer.length;
            this.calcFinalExtras(item);
        });
        if (this.isAllDateListValueZero(report.dateList)) {
            report.dateList = [];
            report.itemList = [];
        }
        dataFromServer.forEach(data => data.dateList.forEach(item => this.calcFinalExtras(item)));
        return report;
    }

    private isAllDateListValueZero(dateList: DateListItem[]): boolean {
        for (let i = 0; i < dateList.length; i++) {
            const item = dateList[i];
            if (item.officialDistance !== 0 || item.privateDistance !== 0 ||
                item.officialTime !== 0 || item.privateTime !== 0 ||
                item.idleTime !== 0 || item.drivingTime !== 0 ||
                item.workingOfficialTime !== 0 || item.workingOfficialDistance !== 0 ||
                item.workingPrivateTime !== 0 || item.workingPrivateDistance !== 0 ||
                item.workingIdleTime !== 0 || item.workingDrivingTime !== 0) {
                    return false;
                }
        }
        return true;
    }

    private addServerData(sourceData: DateListItem, resultData: DateListItem): void {
        resultData.officialDistance += sourceData.officialDistance;
        resultData.privateDistance += sourceData.privateDistance;
        resultData.idleTime += sourceData.idleTime;
        resultData.drivingTime += sourceData.drivingTime;
        resultData.officialTime += sourceData.officialTime;
        resultData.privateTime += sourceData.privateTime;
        resultData.workingIdleTime += sourceData.workingIdleTime;
        resultData.workingDrivingTime += sourceData.sumWorkTime ? sourceData.workingDrivingTime : 0;
        resultData.subList.push(sourceData);
    }

    private calcFinalExtras(data: DateListItem): void {
        data.sumDistance = this.convertToKm(data.officialDistance + data.privateDistance);
        data.sumTime = this.millisToHours(data.officialTime + data.privateTime);
        data.sumIgnitionTime = this.millisToHours(data.drivingTime + data.idleTime);

        data.officialDistance = this.convertToKm(data.officialDistance);
        data.privateDistance = this.convertToKm(data.privateDistance);
        data.officialTime = this.millisToHours(data.officialTime);
        data.privateTime = this.millisToHours(data.privateTime);
        data.workingIdleTime = this.millisToHours(data.workingIdleTime);
        data.workingDrivingTime = data.sumWorkTime ? this.millisToHours(data.workingDrivingTime) : 0;
        data.workingIgnitionTime = data.sumWorkTime ? data.workingDrivingTime + data.workingIdleTime : 0;
        data.idleTime = this.millisToHours(data.idleTime);
        data.drivingTime = this.millisToHours(data.drivingTime);
        data.notWorkingIgnitionTime = Math.max(data.sumWorkTime - data.workingIgnitionTime, 0);

        data.officialDistancePercentage = Math.roundDiv(Math.percent(data.officialDistance, data.sumDistance), 0.1);
        data.privateDistancePercentage = 100 - data.officialDistancePercentage;
        data.officialTimePercentage = Math.roundDiv(Math.percent(data.officialTime, data.sumTime), 0.1);
        data.privateTimePercentage = 100 - data.officialTimePercentage;
        data.idleTimePercentage = Math.roundDiv(Math.percent(data.idleTime, data.sumIgnitionTime), 0.1);
        data.drivingTimePercentage = 100 - data.idleTimePercentage;
        data.workingDrivingTimePercentage = Math.roundDiv(Math.percent(data.workingDrivingTime, data.sumWorkTime), 0.1);
        data.workingIgnitionTimePercentage = Math.roundDiv(Math.percent(data.workingIgnitionTime, data.sumWorkTime), 0.1);
        data.notWorkingIgnitionTimePercentage = 100 - data.workingIgnitionTimePercentage;
    }

    private convertToKm(distance: number): number {
        return distance / 1000;
    }

    private millisToHours(millis: number): number {
        return millis / 3600000;
    }

    private initDateList(dataFromServer: DataUnitModel[]): DateListItem[] {
        const dateList = [];
        if (dataFromServer.length === 0) {
          return dateList;
        }
        const dateOffset = Math.round((this.requestModel.toTime - this.requestModel.fromTime) / this.oneDayTime);
        this.vehicleWorktime = 0;
        let from = new Date(this.requestModel.fromTime);
        if (Settings.WORKING_TIMEZONE) {
            from = from.toTimezone(Settings.WORKING_TIMEZONE);
        }
        for (let i = 0; i < dateOffset; i++) {
            const dateListItem = new DateListItem();
            dateListItem.actualDate = from.getTime();
            from.addDates(1);
            const dayNumber = new Date(dateListItem.actualDate).getDay();
            if (Settings.WORKING_TIMES[Weekdays[dayNumber]]) {
                dateListItem.sumWorkTime += Settings.WORKING_TIMES[Weekdays[dayNumber]] / 60;
                this.vehicleWorktime += dateListItem.sumWorkTime;
            }
            dateList.push(dateListItem);
        }
        return dateList;
    }

    private getReport(): void {
        if (this.fleetReport &&
            this.requestModel.fromTime >= this.previousRequestModel.fromTime &&
            this.previousRequestModel.toTime >= this.requestModel.toTime) {
                this.fleetReportObservable.next(this.createReport(this.fleetDataFromServer));
                this.driversReportObservable.next(this.createReport(this.driversDataFromServer));
        } else {
            this.getReportFromServer();
        }
    }

    private getReportFromServer() {
      const request = {
          fromDate: this.requestModel.fromTime,
          toDate: this.requestModel.toTime,
          vehicleId: null,
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
      };
      if (this.requestModel.fromTime && this.requestModel.toTime) {
          this.authService.http.post(Settings.FLEET_REPORT_URL, request)
              .subscribe(response => {
                  if (response) {
                      this.fleetDataFromServer = response.itemList || [];
                      this.sortDataByDates(this.fleetDataFromServer);
                  } else {
                      this.fleetDataFromServer = [];
                  }
                  this.fleetReportObservable.next(this.createReport(this.fleetDataFromServer));
              });
          this.authService.http.post(Settings.DRIVERS_REPORT_URL, request)
          .subscribe(response => {
              if (response) {
                  this.driversDataFromServer = response.itemList || [];
                  this.sortDataByDates(this.driversDataFromServer);
              } else {
                this.driversDataFromServer = [];
              }
              this.driversReportObservable.next(this.createReport(this.driversDataFromServer));
          });
        }
    }

    private sortDataByDates(dataFromServer: DataUnitModel[]): void {
        for (let i = 0; i < dataFromServer.length; i++) {
            dataFromServer[i].dateList = dataFromServer[i].dateList.sort(function(a, b) {
                return b.actualDate > a.actualDate ? -1 : 1;
            });

            dataFromServer[i].dateList.forEach(item => {
                item.id = dataFromServer[i].id;
                item.identifierName = dataFromServer[i].identifierName;
            });
        }
    }

    public setFromTimeAndToTime(fromTime: number, toTime: number): void {
        if (this.requestModel.fromTime !== fromTime || this.requestModel.toTime !== toTime) {
            this.requestModel.fromTime = fromTime;
            this.requestModel.toTime = toTime;
            if (this.authService.isLoggedIn()) {
                this.getReport();
            }
            this.requestModelObservable.next(new RequestModel(this.requestModel));
        }
    }

}
