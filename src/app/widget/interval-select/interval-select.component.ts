import { Component, OnInit, OnDestroy, OnChanges, SimpleChanges } from '@angular/core';
import { IntervalType, DateModel } from './interval-types';
import { StatisticService } from 'src/app/service/statistic.service';
import { RequestModel } from 'src/app/vehicle-view/vehicle-reports/report';
import { Subscription } from 'rxjs';
import { Unsubscribe } from 'src/app/util/unsubscribe';

@Component({
  selector: 'app-interval-select',
  templateUrl: './interval-select.component.html',
  styleUrls: ['./interval-select.component.scss']
})
@Unsubscribe()
export class IntervalSelectComponent implements OnInit, OnChanges, OnDestroy {

  intervalType = IntervalType;
  readonly oneDayTime = 86400000;
  dateModel: DateModel = new DateModel();
  requestModel: RequestModel = new RequestModel();
  toDateToDisplay: Date;
  requestModelFromStatService: RequestModel;

  private modelSubscription: Subscription;

  constructor(private statisticService: StatisticService) { }

  ngOnInit() {
    this.initDates();
    this.modelSubscription = this.statisticService.requestModelObservable.subscribe(result => {
      this.requestModelFromStatService = result;
      if (this.requestModelFromStatService) {
        this.ngOnChanges();
      } else {
        this.initDates();
      }
    });
  }

  private initDates(): void {
    this.dateModel.selectedOffset = IntervalType.WEEK;
    const endDate = new Date().toStartOfDay();
    this.dateModel.fromDate = new Date(endDate.getTime()).addDates(-this.dateModel.selectedOffset);
    this.dateModel.yesterdayDate = new Date(endDate.getTime()).addDates(-1);
    this.dateModel.toDate = endDate;
    this.setToDateToDisplay();
    this.prepareAndSendRequest();
  }

  ngOnChanges(changes?: SimpleChanges) {
    this.checkYesterday();
    this.checkDateFromStatService();
  }

  ngOnDestroy() {}

  private checkDateFromStatService(): void {
    if (this.requestModelFromStatService) {
      if (this.dateModel.fromDate.getTime() !== this.requestModelFromStatService.fromTime) {
        this.dateModel.fromDate = new Date(this.requestModelFromStatService.fromTime);
        this.dateModel.selectedOffset = this.getDateDiff(this.dateModel.fromDate.getTime(), this.dateModel.toDate.getTime());
      }
      if (this.dateModel.toDate.getTime() !== this.requestModelFromStatService.toTime) {
        this.dateModel.toDate = new Date(this.requestModelFromStatService.toTime);
        this.setToDateToDisplay();
        this.dateModel.selectedOffset = this.getDateDiff(this.dateModel.fromDate.getTime(), this.dateModel.toDate.getTime());
      }
    }
  }

  private setRequestModelDates(): void {
    this.requestModel.fromTime = this.dateModel.fromDate.getTime();
    this.requestModel.toTime = this.dateModel.toDate.getTime();
  }

  private prepareAndSendRequest(): void {
    this.setRequestModelDates();
    this.statisticService.setFromTimeAndToTime(this.requestModel.fromTime, this.requestModel.toTime);
  }

  private setToDateToDisplay(): void {
    this.toDateToDisplay = new Date(this.dateModel.toDate.getTime()).addDates(-1);
  }

  private adjustDateModelDates(toFromDate: boolean): void {
    if (toFromDate) {
      this.dateModel.toDate = new Date(this.dateModel.fromDate.getTime()).addDates(this.dateModel.selectedOffset);
      const today = new Date().toStartOfDay();
      if (this.dateModel.toDate > today) {
        this.dateModel.toDate = today;
      }
      this.setToDateToDisplay();
    } else {
      this.dateModel.fromDate = new Date(this.dateModel.toDate.getTime()).addDates(-this.dateModel.selectedOffset);
    }
  }

  selectDate(event: Date, isFromDateChange: boolean): void {
    if (!isFromDateChange) {
      this.toDateToDisplay = event;
      this.dateModel.toDate = new Date(event.getFullYear(), event.getMonth(), event.getDate() + 1);
    } else {
      this.dateModel.fromDate = event;
    }
    if (this.dateModel.fromDate.getTime() >= this.requestModel.toTime
      || this.dateModel.toDate.getTime() <= this.requestModel.fromTime) {
      this.adjustDateModelDates(isFromDateChange);
    } else if (this.getDateDiff(this.dateModel.fromDate.getTime(), this.dateModel.toDate.getTime()) > IntervalType.MONTH) {
      this.dateModel.selectedOffset = IntervalType.MONTH;
      this.adjustDateModelDates(isFromDateChange);
    }
    this.dateModel.selectedOffset = this.getDateDiff(this.dateModel.fromDate.getTime(), this.dateModel.toDate.getTime());
    this.prepareAndSendRequest();
  }

  private getDateDiff(fromTime: number, toTime: number): number {
    return toTime > fromTime ? Math.round((toTime - fromTime) / this.oneDayTime) : 0;
  }

  private checkYesterday(): void {
    if (this.dateModel.yesterdayDate) {
      const today = new Date().toStartOfDay().addDates(-1);
      if (today !== this.dateModel.yesterdayDate) {
        this.dateModel.yesterdayDate = today;
      }
    }
  }

  onPushIntervalButtons(interval: number): void {
    this.dateModel.selectedOffset = interval;
    this.adjustDateModelDates(false);
    this.prepareAndSendRequest();
  }

  noDefaultInterval(): boolean {
    return this.dateModel.selectedOffset !== IntervalType.DAY &&
           this.dateModel.selectedOffset !== IntervalType.WEEK &&
           this.dateModel.selectedOffset !== IntervalType.MONTH;
  }

  onPushArrows(isPrevious: boolean): void {
    if (this.dateModel.yesterdayDate.getTime() >= this.dateModel.toDate.getTime() || isPrevious) {
      let offset = this.dateModel.selectedOffset;
      if (isPrevious) {
        offset *= -1;
      }
      this.dateModel.toDate = new Date(this.dateModel.toDate.getTime()).addDates(offset);
      const today = new Date().toStartOfDay();
      if (this.dateModel.toDate > today) {
        this.dateModel.toDate = today;
      }
      this.adjustDateModelDates(false);
      this.setToDateToDisplay();
      this.prepareAndSendRequest();
    }
  }
}
