import { Component, AfterViewInit } from '@angular/core';
import { VehicleService } from '../../service/vehicle.service';
import { TabComponent } from '../../component-base';
import { AlertService } from '../../service/alert.service';
import { Settings } from '../../settings/settings';
import { Router } from '@angular/router';

@Component({
  selector: 'app-vehicle-list',
  templateUrl: './vehicle-list.component.html',
  styleUrls: ['./vehicle-list.component.scss']
})
export class VehicleListComponent extends TabComponent implements AfterViewInit {
  readonly keys = Object.keys;

  vehicleData: any[];
  todayAlertData: any[] = [];
  vehicleAlertData: {[key: string]: {[key: string]: any[]}} = {};
  GEOFENCING_ALERT_ICON = Settings.GEOFENCING_ALERT_ICON;

  constructor(private vehicleService: VehicleService, private alertService: AlertService, private router: Router) {
    super();
  }

  ngAfterViewInit() {
    super.ngAfterViewInit();
    this.removableSubscriptions.push(this.vehicleService.getLatestVehicleDataFiltered().subscribe(result => this.vehicleData = result));
    this.removableSubscriptions.push(
      this.alertService.getTodayAlerts().subscribe(result => {
        this.todayAlertData = result;
        this.vehicleAlertData = {};
        if (this.todayAlertData) {
          this.todayAlertData.forEach(alert => {
            if (alert.data.vehicleId) {
              if (!this.vehicleAlertData[alert.data.vehicleId]) {
                this.vehicleAlertData[alert.data.vehicleId] = {};
              }
              const key = alert.data.icon || Settings.getAlertIcon(alert.alertType);
              if (!this.vehicleAlertData[alert.data.vehicleId][key]) {
                this.vehicleAlertData[alert.data.vehicleId][key] = [];
              }
              this.vehicleAlertData[alert.data.vehicleId][key].push(alert);
            }
          });
        }
      })
    );
  }

  moveToVehicle(vehicleId: number): void {
    if (vehicleId) {
      this.router.navigateByUrl('/vehicle-view/' + vehicleId);
    }
  }
}
