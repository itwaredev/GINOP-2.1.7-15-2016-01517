import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { ToasterService } from '../service/toaster.service';
import { TranslateService } from '@ngx-translate/core';
import { VehicleReportsComponent } from '../vehicle-view/vehicle-reports/vehicle-reports.component';

@Component({
  selector: 'app-statistic',
  templateUrl: './statistic.component.html',
  styleUrls: ['./statistic.component.scss']
})
export class StatisticComponent implements OnInit, OnDestroy {
  @ViewChild('vehicleReport') vehicleReport: VehicleReportsComponent;
  selectedIndex: number;

  constructor(private toaster: ToasterService,
              private translateService: TranslateService) { }

  ngOnInit() {}

  ngOnDestroy() {
  }

  selectVehicle(vehicleId: number): void {
    if (vehicleId) {
      this.selectedIndex = 1;
      this.vehicleReport.setVehicleData({vehicleId});
    }
  }

  showToaster() {
    this.toaster.info(this.translateService.instant('MESSAGES.UNAVAILABLE_FUNCTION'));
  }
}
