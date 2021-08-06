import { Component, OnInit, Input, ChangeDetectorRef, OnDestroy,
  ViewChild, ChangeDetectionStrategy, Output, EventEmitter } from '@angular/core';
import { StatisticService } from '../../service/statistic.service';
import { TranslateService } from '@ngx-translate/core';
import { DateListItem, ChartTypes } from './report';
import { VehicleTabComponent } from 'src/app/component-base';
import { VehicleSelectorComponent } from '../../widget/vehicle-selector/vehicle-selector.component';
import { Unsubscribe } from 'src/app/util/unsubscribe';
import { LocalStorage } from 'ngx-webstorage';


@Component({
  selector: 'app-vehicle-reports',
  templateUrl: './vehicle-reports.component.html',
  styleUrls: ['./vehicle-reports.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
@Unsubscribe()
export class VehicleReportsComponent extends VehicleTabComponent implements OnInit, OnDestroy {
  @ViewChild('vehicleSelector') vehicleSelector: VehicleSelectorComponent;
  @Input() hideSelector: boolean;
  @Output() vehicleSelected = new EventEmitter<number>();

  @LocalStorage('vehicle-report.selectedTab', 0)
  selectedTab: number;

  chartTypes = ChartTypes;
  chartSourceData: DateListItem[] = [];
  progressBarSourceData: DateListItem[] = [];
  private globalSourceData: DateListItem[] = [];
  private vehicleId: number;

  constructor(private statisticService: StatisticService,
              private changeDetector: ChangeDetectorRef,
              public translateService: TranslateService) {
    super();
  }

  ngOnInit() {
    this.removableSubscriptions.push(
      this.statisticService.fleetReportObservable.subscribe(result => {
        if (result) {
          this.chartSourceData = result.dateList;
          this.progressBarSourceData = this.globalSourceData = result.itemList;
          this.generateActualData();
        }
      })
    );
  }

  setVehicleData(vehicleData: any, update?: boolean): void {
    if (this.vehicleId !== vehicleData.vehicleId) {
      this.vehicleId = vehicleData.vehicleId;
      if (this.vehicleSelector) {
        this.vehicleSelector.selectVehicle(vehicleData.vehicleId);
      }
      this.generateActualData();
    }
  }

  generateActualData(): void {
    if (this.vehicleId) {
      this.chartSourceData =
      (this.globalSourceData.find(item => item.id === this.vehicleId) || {subList: []}).subList;
      this.progressBarSourceData = null;
    }
    this.changeDetector.markForCheck();
  }

  public get utilisationNoLabel(): string {
    return this.chartSourceData && this.chartSourceData.find(item => item.sumWorkTime != null) ?
      'REPORT.NO_INTERVAL_DATA' :
      'REPORT.NOT_WORKDAY';
  }
}
