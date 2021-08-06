import { Injectable, EventEmitter } from '@angular/core';
import { Observable, ReplaySubject, interval, Subscription } from 'rxjs';
import { startWith, map, shareReplay } from 'rxjs/operators';
import { Settings } from '../settings/settings';
import { VehicleFilterPipe } from '../overview/vehicle-filter/vehicle-filter.pipe';
import { AlertService } from './alert.service';
import { AuthService } from '../auth/auth.service';
import { download } from '../util/utils';

@Injectable()
export class VehicleService {

  private _filters: object;
  onFilterChanged: EventEmitter<any> = new EventEmitter();
  private vehicleData: object[];
  private vehiclesSubject = new ReplaySubject(1);
  private filteredVehicles = this.vehiclesSubject.pipe(
    map(res => {
      return this.vehicleFilterPipe.transform(res as any[], this._filters);
    }, this),
    shareReplay(1)
  );

  private vehicleObs: Observable<any>;
  private driverObs: Observable<any>;
  private groupObs: Observable<any>;

  private intervalSubscription: Subscription;
  private currentInterval: number;

  constructor(private vehicleFilterPipe: VehicleFilterPipe, private alertService: AlertService,
    public authService: AuthService) {
      this.authService.onLogout.subscribe(_ => this.dispose());
      this.authService.onLogin.subscribe(_ => this.init());
      this.clearFilter();
  }

  private init(immediate: boolean = true): void {
    if (!this.intervalSubscription) {
      this.currentInterval = Settings.VEHICLE_DATA_REFRESH_INTERVAL;
      this.intervalSubscription = (immediate ?
        interval(this.currentInterval).pipe(
          startWith(0)
        ) :
        interval(this.currentInterval)
      )
      .subscribe(_ => {
        this.authService.http.post(`${Settings.VEHICLE_URL}/latest-data-by-customer`,
          {canDataNames: Settings.CAN_DATA_NAMES}, null, undefined, this.intervalSubscription != null
        ).subscribe(
          res => {
            this.vehicleData = res as object[];
            this.vehiclesSubject.next(this.vehicleData);
          }
        );
      });
    }
  }

  reinit(): void {
    if (Settings.VEHICLE_DATA_REFRESH_INTERVAL !== this.currentInterval) {
      if (this.intervalSubscription) {
        this.intervalSubscription.unsubscribe();
        this.intervalSubscription = null;
      }
      this.init(false);
      this.alertService.reinit();
    }
  }

  public getLatestVehicleDataFiltered(): Observable<any> {
    this.init();
    return this.filteredVehicles;
  }

  public getLatestVehicleData(): Observable<any> {
    this.init();
    return this.vehiclesSubject;
  }

  public getVehicles(): Observable<any> {
    if (!this.vehicleObs) {
      this.vehicleObs = this.authService.http.get(`${Settings.VEHICLE_URL}/list`, undefined, 1).pipe(shareReplay(1));
    }
    return this.vehicleObs;
  }

  public getGroups(): Observable<any> {
    if (!this.groupObs) {
      this.groupObs = this.authService.http.get(`${Settings.GROUP_URL}/list/objectType=VEHICLE`, undefined, 1).pipe(shareReplay(1));
    }
    return this.groupObs;
  }

  public getDrivers(): Observable<any> {
    if (!this.driverObs) {
      this.driverObs = this.authService.http.get(`${Settings.PERSON_URL}/list`, undefined, 1).pipe(shareReplay(1));
    }
    return this.driverObs;
  }

  public getWaypoints(vehicleId: number, start: Date, end: Date, update: boolean): Observable<any> {
    return this.authService.http.post(`${Settings.VEHICLE_URL}/waypoint`, { vehicleId, start, end }, undefined, undefined, update);
  }

  public getModemMapping(): Observable<any> {
    return this.authService.http.get(`${Settings.VEHICLE_REPORT_URL}/modem-mapping`);
  }

  public getModemData(vehicleIds: number[], fromDate: Date, toDate: Date, page: number, pageSize: number): Observable<any> {
    return this.authService.http
      .post(`${Settings.VEHICLE_REPORT_URL}/modem-data`, { vehicleIds, fromDate, toDate, page, pageSize }, undefined, undefined, true);
  }

  public exportModemData(vehicleIds: number[], fromDate: Date, toDate: Date): void {
    this.authService.http.post(Settings.EXPORT_URL,
      { type: 'MODEMREPORT', sheetName: 'modemdata', filters: { vehicleIds, fromDate, toDate } },
      undefined, {responseType: 'blob'})
      .subscribe(result => {
        console.log(result);
        download(
            window.URL.createObjectURL(
              new Blob([result], {type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'})
            ),
            'modemdata-export.xlsx'
        );
    });
  }

  public get filters(): object {
    return this._filters;
  }

  public set filters(filters: object) {
    this._filters = filters || this._filters;
    this.vehiclesSubject.next(undefined);
    this.vehiclesSubject.next(this.vehicleData);
    this.alertService.filters = this._filters;
    this.onFilterChanged.emit();
  }

  public clearFilter(): void {
    this.filters = {licensePlate: null, driverName: null, group: null};
  }

  dispose(): void {
    if (this.intervalSubscription) {
      this.intervalSubscription.unsubscribe();
      this.intervalSubscription = null;
    }
    this.vehicleData = undefined;
    this.vehiclesSubject.next(this.vehicleData);
    this.vehicleObs = null;
    this.driverObs = null;
    this.groupObs = null;
  }
}
