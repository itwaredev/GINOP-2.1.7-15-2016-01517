import { Injectable } from '@angular/core';
import { Observable, ReplaySubject, Subscription, interval } from 'rxjs';
import { Settings } from '../settings/settings';
import { map, shareReplay, startWith, first } from 'rxjs/operators';
import { AlertFilterPipe } from '../overview/vehicle-filter/alert-filter.pipe';
import { AuthService } from '../auth/auth.service';

@Injectable()
export class AlertService {

  private _filters: object;
  private todayAlertsData: object[];
  private oldAlertsData: object[];
  private todayAlertsSubject = new ReplaySubject(1);
  private oldAlertsSubject = new ReplaySubject(1);

  private intervalSubscription: Subscription;
  private currentInterval: number;

  constructor(private alertFilterPipe: AlertFilterPipe, private authService: AuthService) {
    this.authService.onLogout.subscribe(_ => this.dispose());
    this.authService.onLogin.subscribe(_ => this.init());
  }

  private init(immediate: boolean = true): void {
    if (!this.intervalSubscription) {
      this.currentInterval = Settings.VEHICLE_DATA_REFRESH_INTERVAL;
      this.intervalSubscription = (immediate ?
        interval(this.currentInterval).pipe(
          startWith(0),
        ) :
        interval(this.currentInterval)
      )
      .subscribe(
        _ => {
          const now = new Date();
          const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          this.authService.http.post(`${Settings.ALERT_URL}/today`, { refDate: today }, null, undefined, true).subscribe(res => {
            this.todayAlertsData = res as object[];
            this.todayAlertsSubject.next(this.todayAlertsData);
          });
          this.authService.http.post(`${Settings.ALERT_URL}/old`, { refDate: today, pageNumber: 0, pageSize: 50 }, null, undefined, true)
          .subscribe(res => {
            this.oldAlertsData = (res || {}).response as object[];
            this.oldAlertsSubject.next(this.oldAlertsData);
          });
        }
      );
    }
  }

  reinit(): void {
    if (Settings.VEHICLE_DATA_REFRESH_INTERVAL !== this.currentInterval) {
      if (this.intervalSubscription) {
        this.intervalSubscription.unsubscribe();
        this.intervalSubscription = null;
      }
      this.init(false);
    }
  }

  getTodayAlerts(): Observable<any> {
    this.init();
    return this.todayAlertsSubject;
  }

  getPastAlerts(): Observable<any> {
    this.init();
    return this.oldAlertsSubject;
  }

  public filter(alerts: any[]): any[] {
    return this.alertFilterPipe.transform(alerts, this._filters);
  }

  public set filters(filters: object) {
    this._filters = filters;
    this.todayAlertsSubject.next(this.todayAlertsData);
    this.oldAlertsSubject.next(this.oldAlertsData);
  }

  getTemplates(): Observable<any> {
    return this.authService.http.get(`${Settings.ALERT_TEMPLATE_URL}/list`);
  }

  getConfigs(): Observable<any> {
    return this.authService.http.get(`${Settings.ALERT_CONFIG_URL}/list`);
  }

  saveConfig(alertConfig: any): Observable<any> {
    return this.authService.http.post(`${Settings.ALERT_CONFIG_URL}/save`, alertConfig);
  }

  deleteConfig(alertConfig: any): Observable<any> {
    return this.authService.http.delete(`${Settings.ALERT_CONFIG_URL}/delete/${alertConfig.id}`);
  }

  getStatics(): Observable<any> {
    return this.authService.http.get(`${Settings.STATIC_ALERT_URL}/list`);
  }

  saveStatic(staticAlert: any): Observable<any> {
    return this.authService.http.post(`${Settings.STATIC_ALERT_URL}/save`, staticAlert);
  }

  deleteStatic(staticAlert: any): Observable<any> {
    return this.authService.http.delete(`${Settings.STATIC_ALERT_URL}/delete/${staticAlert.id}`);
  }

  getContacts(): Observable<any> {
    return this.authService.http.get(`${Settings.CONTACT_URL}/list`);
  }

  saveContact(contact: any): Observable<any> {
    return this.authService.http.post(`${Settings.CONTACT_URL}/save`, contact);
  }

  deleteContact(contact: any): Observable<any> {
    return this.authService.http.delete(`${Settings.CONTACT_URL}/delete/${contact.id}`);
  }

  dispose(): void {
    if (this.intervalSubscription) {
      this.intervalSubscription.unsubscribe();
      this.intervalSubscription = null;
    }
    this.todayAlertsData = undefined;
    this.todayAlertsSubject.next(this.todayAlertsData);
    this.oldAlertsData = undefined;
    this.oldAlertsSubject.next(this.oldAlertsData);
  }
}
