import { Injectable, EventEmitter } from '@angular/core';
import { Settings } from '../settings/settings';
import { Router } from '@angular/router';
import { first } from 'rxjs/operators';
import { LoadingProgressService } from '../widget/loading-indicator/loading-progress.service';
import { Crashlytics } from '@ionic-native/fabric/ngx';
import { loadScripts } from '../util/utils';
import { AuthHttpClient } from '../util/http';
import { HttpErrorResponse } from '@angular/common/http';
import { Platform } from '@ionic/angular';
import { Firebase } from '@ionic-native/firebase/ngx';
import { Toast } from '@ionic-native/toast/ngx';
import { Observable } from 'rxjs';

@Injectable()
export class AuthService {

  private _userCheckProcess: Promise<any>;
  public get userCheckProcess(): Promise<any> {
    return this._userCheckProcess;
  }

  private userData: any;
  private loggedInUser: any;

  public onLogout: EventEmitter<any> = new EventEmitter();
  public onLogin: EventEmitter<any> = new EventEmitter();
  public userLoad: EventEmitter<any> = new EventEmitter();

  constructor(public readonly http: AuthHttpClient,
              private router: Router,
              public readonly loadingProgressService: LoadingProgressService,
              private crashlytics: Crashlytics,
              private platform: Platform,
              private firebase: Firebase,
              private toast: Toast) {
    this._userCheckProcess = this.checkIfUserLoggedIn()
      .then(_ => this._userCheckProcess = null, _ => this._userCheckProcess = null);
    this.http.error.subscribe((err: HttpErrorResponse) => {
      if (err.status === 401 || err.status === 403) {
        this.logout();
      }
    });
  }

  public async checkIfUserLoggedIn(): Promise<void> {
    if ((localStorage.getItem('userdata') || localStorage.getItem('jwt_token')) && !this.userData) {
      const userData = JSON.parse(localStorage.getItem('userdata')) || { token: localStorage.getItem('jwt_token') };

      await Promise.all([
        this.loadScripts(userData),
        this.http.get(Settings.BASE_URL + '/user', undefined, undefined, true).toPromise().then(res => {
          this.loadUserData(res);
          this.loggedInUser = res;
        })
      ]);

      this.userData = userData;
    }
  }

  private loadScripts(userData: any = this.userData): Promise<HTMLScriptElement[]> {
    return loadScripts(
      !userData.mapsApiKey ? [] :
    [
      {src: `${Settings.GOOGLE_MAPS_JS_PATH}?key=${userData.mapsApiKey}`, id: 'gmapsjs'},
      {src: 'assets/htmlinfowindow.js', id: 'gmapshtmlinfowindow'},
      {src: 'assets/markerclusterer.js', id: 'gmapsmarkerclusterer'},
      {src: 'assets/clustericon.js', id: 'gmapsclustericon'}
    ]);
  }

  private loadUserData(loggedInUser: any = this.loggedInUser): void {
    this.platform.ready().then(_ => {
      if (window['fabric'] && window['fabric'].Crashlytics) {
        this.crashlytics.setUserIdentifier(loggedInUser.id);
        this.crashlytics.setUserName(loggedInUser.fleetCustomerName + ' - ' + loggedInUser.loginName);
      }
    });

    localStorage.setItem('loggedInUser', JSON.stringify(loggedInUser));
    const tmpHours = localStorage.getItem('tmpWorkingHours');
    Settings.WORKING_TIMEZONE = loggedInUser.workingTimezone || Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (tmpHours) {
      Settings.WORKING_HOURS = JSON.parse(tmpHours);
      this.saveWorkingHours();
    } else {
      Settings.WORKING_HOURS = loggedInUser.workingHours || {};
      Settings.WORKING_DAYS = Object.keys(Settings.WORKING_HOURS);
      Settings.WORKING_TIMES = {};
      Object.keys(Settings.WORKING_HOURS).forEach(key => {
        const workingHoursList = Settings.WORKING_HOURS[key];
        Settings.WORKING_TIMES[key] = 0;
        for (let j = 0; j < workingHoursList.length; j++) {
          let from = workingHoursList[j].start, to = workingHoursList[j].end;
          for (let k = 0; k < j; k++) {
              if (from < workingHoursList[k].end && from > workingHoursList[k].start) {
                  from = workingHoursList[k].end;
              }
              if (to < workingHoursList[k].end && to > workingHoursList[k].start) {
                  to = workingHoursList[k].start;
              }
          }
          Settings.WORKING_TIMES[key] += Math.max(to - from, 0);
        }
      });
    }
    this.userLoad.emit();
  }

  public get loggedInUserData() {
    return this.loggedInUser;
  }

  public async login(fleetcustomer: string, loginname: string, password: string): Promise<any> {
    if (!this.userData) {
        this.userData = {};

        return await this.http.post(Settings.AUTH_URL, {fleetcustomer, loginname, password}).toPromise().then(
          async result => {
            if (result) {
              localStorage.setItem('jwt_token', (result as any).token);
              localStorage.setItem('userdata', JSON.stringify(result));

              await Promise.all([
                this.loadScripts(result),
                this.http.get(Settings.BASE_URL + '/user').toPromise().then(res => {
                  this.loadUserData(res);
                  this.loggedInUser = res;
                })
              ]);
              this.initializeFirebase();

              this.onLogin.emit();
              this.userData = result;
              this.router.navigateByUrl('/');
              return this.userData;
            }
          },
          err => {
            if (err) {
              if (err.status === 401) {
                this.loadingProgressService.error('auth-login', 'BAD_CREDENTIALS');
              }
            }
            this.userData = null;
            throw err;
          }
        );
      }
  }

  public logout(navigate: boolean = true): void {
    this.userData = null;
    this.onLogout.emit();
    if (navigate) {
      this.router.navigateByUrl('/login');
    }
    localStorage.clear();
  }

  public refreshAlertsChecked(date?: number | Date): void {
    const refDate = date ? new Date(date) : new Date();
    this.http.post(Settings.USERACCOUNT_URL + '/alerts-checked', {checkStamp: refDate}).pipe(first()).subscribe(res => {
      this.loggedInUser.alertsChecked = res;
      localStorage.setItem('loggedInUser', JSON.stringify(this.loggedInUser));
    });
  }

  public saveWorkingHours(): void {
    const workingHours = Settings.WORKING_HOURS;
    const workingTimezone = Settings.WORKING_TIMEZONE;
    localStorage.removeItem('tmpWorkingHours');
    this.http.post(Settings.USERACCOUNT_URL + '/workinghours', {workingHours, workingTimezone}, 'donttouchthis')
    .pipe(first()).subscribe(res => {
      this.loggedInUser.workingHours = res['workingHours'];
      this.loggedInUser.workingTimezone = res['workingTimezone'];
      this.loadUserData();
    });
  }

  public isLoggedIn(): boolean {
    return this.userData && this.userData.token;
  }

  getUsers(): Observable<any> {
    return this.http.get(`${Settings.USERACCOUNT_URL}/list`);
  }

  public hasAccess(key, accessType): boolean {
    return true;
  }

  private initializeFirebase() {
    try {
      if (this.platform.is('hybrid') || this.platform.is('mobile')) {
        this.firebase.subscribe('all');
        this.firebase.onTokenRefresh().subscribe(token => {
          this.http.post(Settings.USERACCOUNT_URL + '/token', token).subscribe();
        });
        if (this.platform.is('android')) {
          this.firebase.getToken().catch(error => console.error('Error getting token', error));
        } else if (this.platform.is('ios')) {
          this.firebase.grantPermission()
          .then(() => {
            this.firebase.getToken().catch(error => console.error('Error getting token', error));
          })
          .catch((error) => {
            this.firebase.logError(error);
          });
        }
        this.firebase.onNotificationOpen().subscribe((response) => {
          if (!response.tap) {
            // received while app in foreground (show a toast)
            this.toast.show(response.body, '3000', 'center').subscribe();
          } else {
            // Received while app in background (this should be the callback when a system notification is tapped)
            // This is empty for our app since we just needed the notification to open the app
          }
        });
      }
    } catch (error) {
      this.firebase.logError(error);
    }
  }
}
