import { ProgressbarSetComponent } from './../../widget/progressbar-set/progressbar-set.component';
import { TabComponent } from './../../component-base';
import { DateListItem, ChartTypes } from './../../vehicle-view/vehicle-reports/report';
import { Component, OnInit, Input, Output, EventEmitter, ViewChild } from '@angular/core';
import { StatisticService } from 'src/app/service/statistic.service';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-drivers-stat',
  templateUrl: './drivers-stat.component.html',
  styleUrls: ['./drivers-stat.component.scss'],
})
export class DriversStatComponent extends TabComponent implements OnInit {

  progressBarSourceData: DateListItem[];
  sumField = 'sumTime';
  chartType = ChartTypes.TIME;
  @Input() datasetMeta: {
    prefix: string,
    color: string,
    label: string
  }[] = [];
  @Output() switchToObject: EventEmitter<any> = new EventEmitter();

  constructor(private statisticService: StatisticService, public translateService: TranslateService) {
    super();
  }

  ngOnInit() {
    this.statisticService.driversReportObservable.subscribe(result => {
      if (result) {
        this.progressBarSourceData = result.itemList;
      }
    });
  }
}
