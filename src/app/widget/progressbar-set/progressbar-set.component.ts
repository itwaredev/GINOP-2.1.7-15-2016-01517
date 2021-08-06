import { Component, Input, SimpleChanges, OnChanges, Output, EventEmitter } from '@angular/core';
import { DateListItem } from 'src/app/vehicle-view/vehicle-reports/report';
import { TranslateService } from '@ngx-translate/core';
import { Settings } from 'src/app/settings/settings';

@Component({
  selector: 'app-progressbar-set',
  templateUrl: './progressbar-set.component.html',
  styleUrls: ['./progressbar-set.component.scss']
})
export class ProgressbarSetComponent implements OnChanges {

  @Input() progressBarSourceData: DateListItem[] = [];
  @Input() chartType: {
    valueFix: (value: number) => string,
    fieldSuffix: string,
    unit: string,
    percentageSuffix: string
  };
  @Input() datasetMeta: {
    prefix: string,
    color: string,
    label: string
  }[] = [];
  @Input() sumField: string;
  @Input() displayAverageLabel: boolean;
  @Input() inline = true;
  @Output() switchToObject: EventEmitter<any> = new EventEmitter();

  clonedProgressBarSourceData: DateListItem[] = [];
  maxLicenseWidth = 0;
  maxSumWidth = 0;
  average = 0;
  averageLeft = 0;
  barWidth: number;
  private unknownLabel = this.translateService.instant('REPORT.UNKNOWN');

  getRankBgColor = Settings.getRankBgColor;

  constructor(private translateService: TranslateService) { }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['progressBarSourceData']) {
      if (this.progressBarSourceData) {
        this.clonedProgressBarSourceData = JSON.parse(JSON.stringify(this.progressBarSourceData));
        this.sortClonedProgressBarData();
      }
    }
  }

  sortClonedProgressBarData(): void {
    this.clonedProgressBarSourceData.sort((a: DateListItem, b: DateListItem) => {
      return a[this.sumField] > b[this.sumField] ? -1 : 1;
    });

    this.maxLicenseWidth = this.maxSumWidth = this.average = 0;
    let sumData = 0;
    this['max' + this.chartType.fieldSuffix] = 0;
    this.clonedProgressBarSourceData.forEach(item => {
      this['max' + this.chartType.fieldSuffix] =
        Math.max(this['max' + this.chartType.fieldSuffix], item[this.sumField]);
      this.maxLicenseWidth = Math.max(this.maxLicenseWidth, (item.identifierName || this.unknownLabel).length * 11);
      this.maxSumWidth = Math.max(this.maxSumWidth, (this.chartType.valueFix(item[this.sumField]) + this.chartType.unit).length * 9);
      item[`${this.sumField}Percentage`] = Math.percent(item[this.sumField], this['max' + this.chartType.fieldSuffix]);

      sumData += item[this.sumField];
    });
    this.average = sumData / (this.clonedProgressBarSourceData.length || 1);

    let maxData = 1;
    if (this.clonedProgressBarSourceData.length) {
      maxData = this.clonedProgressBarSourceData[0][this.sumField];
    }
    this.averageLeft = this.average / maxData;
  }
}
