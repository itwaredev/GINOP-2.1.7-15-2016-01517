import { Component, OnInit, ViewChild, ElementRef, Input, Output, EventEmitter, OnDestroy, OnChanges, SimpleChanges } from '@angular/core';
import { DateListItem, ChartTypes } from 'src/app/vehicle-view/vehicle-reports/report';
import { TranslateService } from '@ngx-translate/core';
import Chart from 'chart.js';
import { DateAdapter } from '@angular/material';
import { Settings } from 'src/app/settings/settings';
import { LocalStorageService } from 'ngx-webstorage';
import { Subscription } from 'rxjs';
import { Unsubscribe } from 'src/app/util/unsubscribe';

@Component({
  selector: 'app-report-chart',
  templateUrl: './report-chart.component.html',
  styleUrls: ['./report-chart.component.scss'],
})
@Unsubscribe()
export class ReportChartComponent implements OnInit, OnChanges, OnDestroy {
  @ViewChild('chart') chartCanvas: ElementRef<HTMLCanvasElement>;
  private chart: any;

  @Input() chartSourceData: DateListItem[] = [];
  @Input() progressBarSourceData: DateListItem[] = [];
  @Input() type = 'bar';
  @Input() readonly chartTypes = [ChartTypes.DISTANCE];
  @Input() datasetMeta: {
    prefix: string,
    color: string,
    label: string
  }[] = [];
  @Input() noDataLabel = 'REPORT.NO_INTERVAL_DATA';
  @Input() sumFieldInfix = '';
  @Input() storageKey = '';

  @Output() switchToObject: EventEmitter<any> = new EventEmitter();

  private chartSourceDataString: string;
  private currentChartIndex = 0;
  private chartIndexSubscription: Subscription;
  chartType: {
    valueFix: (value: number) => string,
    fieldSuffix: string,
    unit: string,
    percentageSuffix: string
  };
  private baseSets: any[][] = [];
  private readonly sumLabel = this.translateService.instant('REPORT.SUM');
  sumField: string;
  yMaxLen: number;

  constructor(private translateService: TranslateService, private dateAdapter: DateAdapter<any>, private storage: LocalStorageService) {}

  ngOnInit() {
    this.chartIndexSubscription = this.storage.observe(this.storageKey + '.currentChartIndex').subscribe(value => {
      if (value != null && value !== this.currentChartIndex) {
        this.currentChartIndex = value - 1;
        this.chartToggle();
      }
    });
    this.chartType = this.chartTypes[this.currentChartIndex];
    this.sumField = `sum${this.sumFieldInfix}${this.chartType.fieldSuffix}`;
    this.chart = new Chart(this.chartCanvas.nativeElement.getContext('2d'), {
      type: this.type
    });
    this.checkIfNewData();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (this.chart) {
      this.checkIfNewData();
    }
  }

  ngOnDestroy() {
    if (this.chart) {
      this.chart.destroy();
    }
  }

  chartToggle() {
    this.currentChartIndex = ++this.currentChartIndex % this.chartTypes.length;
    this.storage.store(this.storageKey + '.currentChartIndex', this.currentChartIndex);
    this.chartType = this.chartTypes[this.currentChartIndex];
    this.sumField = `sum${this.sumFieldInfix}${this.chartType.fieldSuffix}`;
    this.createChart();
  }

  checkIfNewData() {
    const chartSourceDataString = JSON.stringify(this.chartSourceData);
    if (this.chartSourceData && this.chartSourceDataString !== chartSourceDataString) {
      this.chartSourceDataString = chartSourceDataString;
      this.createChart();
    }
  }

  createChart(): void {
    this.chart.type = this.type;
    this.baseSets.length = 0;

    this.chart.data = {
      labels: this.chartSourceData.map(chartData => {
        const actual = new Date(chartData.actualDate);
        return actual.toLocaleDateString(this.dateAdapter ? [this.dateAdapter['locale']] : [], {month: '2-digit', day: '2-digit'});
      }),
      datasets: this.datasetMeta.map(dsm => {
        return {
          label: this.createLegend(dsm.prefix, dsm.label),
          backgroundColor: dsm.color,
          data: this.createDataSet(dsm.prefix)
        };
      })
    };

    let yMax = 0;
    if (this.chartType.percentageSuffix) {
      yMax = 100;
    } else {
      const max = this.chartSourceData.map(item => item[this.sumField])
        .reduce((val, current) => Math.max(val, current), 0);
      yMax = Math.ceilDiv(max, Math.pow(10, Math.floor(Math.log10(max || 1))));
      if (!yMax) {
        yMax = 1;
      }
    }
    this.yMaxLen = yMax.toString().length * 10.5 + (this.chartType.percentageSuffix ? ' %' : this.chartType.unit).length * 6.5;

    this.chart.options = {
      tooltips: {
        callbacks: {
          title: (tooltipItem: any) => tooltipItem[0].xLabel,
          label: (tooltipItem: any, data: any) => {
            const all = this.baseSets[tooltipItem.index].reduce((prev, current) => prev + current, 0) || 1;
            const value = this.baseSets[tooltipItem.index][tooltipItem.datasetIndex];
            return [
              this.datasetMeta[tooltipItem.datasetIndex].label, ': ', Math.roundDiv(Math.percent(value, all), 0.1).toFixed(1),
              '% ', this.chartType.valueFix(value), this.chartType.unit
            ].join('');
          },
          afterLabel: (tooltipItem: any, data: any) => {
            const value = this.chartSourceData[tooltipItem.index][this.sumField];
            return `${this.sumLabel}: ${this.chartType.valueFix(value)} ${this.chartType.unit}`;
          }
        }
      },
      scales: {
        xAxes: [{ stacked: true }],
        yAxes: [{
          stacked: true,
          ticks: {
            max: yMax,
            callback: (value: number) => value.toFixedPrecision() + (this.chartType.percentageSuffix ? ' %' : this.chartType.unit)
          }
        }]
      },
      legend: {
        position: 'bottom',
        labels: {
          usePointStyle: true
        }
      }
    };
    this.chart.update();
  }

  private createLegend(fieldPrefix: string, label: string): string {
    let partial = 0, all = 0;
    this.chartSourceData.forEach(item => {
      partial += item[fieldPrefix + this.chartType.fieldSuffix];
      all += item[this.sumField];
    });

    return [`${(Math.roundDiv(Math.percent(partial, all), 0.1)).toFixed(1)}% ${label} ${this.chartType.valueFix(partial)}`,
      this.chartType.unit].join('');
  }

  private createDataSet(fieldPrefix: string): any[] {
    if (!this.chartSourceData) {
      return null;
    }
    this.chartSourceData.map(item => item[fieldPrefix + this.chartType.fieldSuffix]).forEach((val, index) => {
      this.baseSets[index] = this.baseSets[index] || [];
      this.baseSets[index].push(val);
    });
    const baseField = `${fieldPrefix}${this.chartType.fieldSuffix}`;
    const field = `${baseField}${this.chartType.percentageSuffix}`;
    return this.chartSourceData.map(item => item[baseField] > item[this.sumField] ? 0 : item[field]);
  }

  getBarRightMargin(vehicleData: DateListItem): string {
    const percentage = 100 - Math.round(Math.percent(vehicleData[this.sumField], this['max' + this.chartType.fieldSuffix]));
    return (2 + 0.27 * percentage) + 'vw';
  }
}
