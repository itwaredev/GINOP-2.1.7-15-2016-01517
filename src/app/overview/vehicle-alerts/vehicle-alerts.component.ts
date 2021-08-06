import { Component, Output, EventEmitter, ChangeDetectionStrategy, ChangeDetectorRef, AfterViewInit, Input } from '@angular/core';
import { VehicleTabComponent } from '../../component-base';
import { AlertService } from '../../service/alert.service';
import { AuthService } from '../../auth/auth.service';
import { Settings } from '../../settings/settings';

@Component({
  selector: 'app-vehicle-alerts',
  templateUrl: './vehicle-alerts.component.html',
  styleUrls: ['./vehicle-alerts.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class VehicleAlertsComponent extends VehicleTabComponent implements AfterViewInit {
  @Output() unseenCountChanged: EventEmitter<number> = new EventEmitter<number>();

  private vehicleData: any;
  private todayAlertData: any[] = [];
  private pastAlertData: any[] = [];
  filteredTodayAlerts: any[] = [];
  filteredPastAlerts: any[] = [];
  private _unseenCount: number;
  readonly getAlertIcon = Settings.getAlertIcon;

  constructor(private alertService: AlertService, private authService: AuthService, private cdr: ChangeDetectorRef) {
    super();
  }

  ngAfterViewInit() {
    super.ngAfterViewInit();
    this.removableSubscriptions.push(
      this.alertService.getTodayAlerts().subscribe(result => {
        this.todayAlertData = result;
        this.filterAlerts(true);
        this._unseenCount = this.getUnseenCount();
        this.unseenCountChanged.emit(this._unseenCount);
      })
    );
    this.removableSubscriptions.push(
      this.alertService.getPastAlerts().subscribe(result => {
        this.pastAlertData = result;
        this.filterAlerts(false, true);
      })
    );
  }

  setVehicleData(vehicleData: any): void {
    this.vehicleData = vehicleData;
    this.filterAlerts(true, true);
    this._unseenCount = this.getUnseenCount();
  }

  private filterAlerts(today?: boolean, past?: boolean): void {
    if (today) {
      this.filteredTodayAlerts = this.vehicleData ?
        (this.todayAlertData || []).filter(item => item.data.vehicleId === this.vehicleData.vehicleId) :
        this.alertService.filter(this.todayAlertData);
    }
    if (past) {
      this.filteredPastAlerts = this.vehicleData ?
        (this.pastAlertData || []).filter(item => item.data.vehicleId === this.vehicleData.vehicleId) :
        this.alertService.filter(this.pastAlertData);
    }
    this.cdr.markForCheck();
  }

  public get unseenCount() {
    return this._unseenCount;
  }

  switch(): void {
    if (this._unseenCount) {
      this.authService.refreshAlertsChecked(this.filteredTodayAlerts[this.filteredTodayAlerts.length - 1].createdDate);
      this._unseenCount = 0;
    }
  }

  private getUnseenCount(): number {
    if (this.filteredTodayAlerts && this.authService.loggedInUserData) {
      if (this.authService.loggedInUserData.alertsChecked) {
        return this.filteredTodayAlerts.filter(item => item.createdDate > this.authService.loggedInUserData.alertsChecked).length;
      } else {
        return this.filteredTodayAlerts.length;
      }
    }
    return 0;
  }
}
