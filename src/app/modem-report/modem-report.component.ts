import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { VehicleService } from 'src/app/service/vehicle.service';
import { first, map, tap } from 'rxjs/operators';
import { StringNumberComparator } from 'src/app/util/comparators';
import { SafedatePipe } from '../util/safedate.pipe';
import { SortOrder, TableConfig } from '../widget/page-scroll-table/table-model';
import { PageScrollTableComponent } from '../widget/page-scroll-table/page-scroll-table.component';
import { TranslateService, LangChangeEvent, TranslationChangeEvent } from '@ngx-translate/core';

@Component({
  selector: 'app-modem-report',
  templateUrl: './modem-report.component.html',
  styleUrls: ['./modem-report.component.scss']
})
export class ModemReportComponent implements OnInit, OnDestroy {
  @ViewChild(PageScrollTableComponent) pageScroll: PageScrollTableComponent;

  metadata = {
    name: 'filter_vehicle',
    groups: [{
      class: 'flex-form',
      fields: [
        {
          name: 'vehicleIds',
          displayName: 'licensePlate',
          type: 'multiselect',
          notranslate: true,
          objectLabelField: 'licensePlate',
          objectValueField: 'id',
          options: []
        },
        {
          name: 'date',
          type: 'datepicker',
          maxDate: new Date().toStartOfDay().addDates(1)
        }
      ]
    }]
  };

  model = {
    vehicleIds: [],
    date: new Date().toStartOfDay()
  };

  totalsize = null;

  tableConfig: TableConfig = {
    head: {
        config: []
    },
    body: {
      style: {
        height: '48px'
      }
    }
  };

  private comparator = new StringNumberComparator();

  constructor(public vehicleService: VehicleService, private datePipe: SafedatePipe, private translateService: TranslateService) {}

  ngOnInit(): void {

    this.translateService.onLangChange.subscribe((event: LangChangeEvent) => {
      console.log("Language changed", event);
      this.tableConfig.head.config = [
        {fields: [{name: 'id', title: this.translateService.instant('MODEM_REPORT.id')}], style: {width: '100px'}},
        {fields: [{name: 'gpsTime', title: this.translateService.instant('MODEM_REPORT.gpsTime'), formatter: item => this.datePipe.transform(item.gpsTime, 'datetime')}], style: {width: '135px'}},
        {fields: [{name: 'licensePlate', title: this.translateService.instant('MODEM_REPORT.licensePlate')}], style: {width: '100px'}},
        {fields: [{name: 'vehicleName', title: this.translateService.instant('MODEM_REPORT.vehicleName')}], style: {width: '100px'}},
        {fields: [{name: 'longitude', title: this.translateService.instant('MODEM_REPORT.longitude')}], style: {width: '100px'}},
        {fields: [{name: 'latitude', title: this.translateService.instant('MODEM_REPORT.latitude')}], style: {width: '100px'}},
        {fields: [{name: 'altitude', title: this.translateService.instant('MODEM_REPORT.altitude')}], style: {width: '100px'}},
        {fields: [{name: 'angle', title: this.translateService.instant('MODEM_REPORT.angle')}], style: {width: '100px'}},
        {fields: [{name: 'speedometer', title: this.translateService.instant('MODEM_REPORT.speedometer')}], style: {width: '100px'}}
      ];
  
      this.metadata.groups[0].fields[0].options.length = 0;
      this.vehicleService.getVehicles().pipe(first())
      .subscribe(res => res.sort((a, b) => this.comparator.compare(a, b, 'licensePlate', null, false, false, true))
        .forEach(item => this.metadata.groups[0].fields[0].options.push(item)));
      this.vehicleService.getModemMapping().subscribe(
        result => {
          if (result) {
            const nameMap = {};
            result.forEach(res => {
              res.mappingDataList.forEach(mapping => {
                if (!nameMap[mapping.name]) {
                  this.tableConfig.head.config.push({fields: [{name: mapping.name, title: this.translateService.instant(`MODEM_REPORT.${mapping.name}`),
                    formatter: modem => {
                      const typedMappingEntry = result.find(item => item.modemType === modem.modemtype)
                      .mappingDataList.find(mappingEntry => mapping.name === mappingEntry.name);
                      return modem.data[(typedMappingEntry || {}).id];
                    }
                  }], style: {width: '170px'}});
                  nameMap[mapping.name] = true;
                }
              });
            });
          }
        }
      );
    });

    this.translateService.onTranslationChange.subscribe((event: TranslationChangeEvent) => {
      console.log("Translation changed", event);
    });


  }

  filter(): void {
    this.pageScroll.reset();
    this.pageScroll.next();
  }

  getBatch = (page: number, pageSize: number, sort: string, sortOrder: SortOrder) =>
    this.vehicleService.getModemData(this.model.vehicleIds, this.model.date, new Date(this.model.date).addDates(1), page, pageSize)
    .pipe(map(result => {
      this.totalsize = result.totalSize;
      return { result: result.response.map(item => {
        item.gpsTime = new Date(item.gpsTime);
        return item;
      }),
      totalSize: result.totalSize}})
    )

  export(): void {
    this.vehicleService.exportModemData(this.model.vehicleIds, this.model.date, new Date(this.model.date).addDates(1));
  }

  ngOnDestroy(): void {
    this.metadata.groups[0].fields[0].options.length = 0;
  }
}
