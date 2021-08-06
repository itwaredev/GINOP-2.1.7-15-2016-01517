import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { AuthService } from './auth/auth.service';
import { Location, LocationStrategy, PathLocationStrategy } from '@angular/common';
import { TranslateService } from '@ngx-translate/core';
import { Settings } from './settings/settings';
import { HistoryService } from './service/history.service';
import { Subscription } from 'rxjs';
import { environment } from 'src/environments/environment';
import { ToasterService } from './service/toaster.service';
import { DateAdapter, MatSidenav } from '@angular/material';
import { Unsubscribe } from './util/unsubscribe';
import { Router, Event, NavigationStart, NavigationError } from '@angular/router';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  providers: [Location, {provide: LocationStrategy, useClass: PathLocationStrategy}],
})
@Unsubscribe()
export class AppComponent implements OnInit, OnDestroy {
  @ViewChild('menu') menu: MatSidenav;
  private selectedLanguage;
  title: any;

  SIDENAV_ITEMS = Settings.SIDENAV_ITEMS;
  history = [];

  private historySubscription: Subscription;
  private routeSubscription: Subscription;
  private loginSubscription: Subscription;
  private logoutSubscription: Subscription;

  frameDisabled = false;

  constructor(
    public authService: AuthService,
    public location: Location,
    public translate: TranslateService,
    public historyService: HistoryService,
    private toaster: ToasterService,
    private adapter: DateAdapter<any>,
    private router: Router
    ) {
    this.routeSubscription = this.router.events.subscribe((event: Event) => {
      if (event instanceof NavigationStart) {
        this.frameDisabled = event.url.includes('int/');
      } else if (event instanceof NavigationError) {
        this.frameDisabled = !event.url.includes('int/');
      }
      this.updateMenuState();
    });

    this.translate.addLangs(Settings.SUPPORTED_LANGS);
    this.translate.setDefaultLang(Settings.SUPPORTED_LANGS[1]);
    this.selectedLanguage = navigator.language;
    this.translate.use(this.selectedLanguage.match(/en|hu/) ? this.selectedLanguage.split('-')[0] : Settings.SUPPORTED_LANGS[0]);
    this.adapter.setLocale(this.selectedLanguage);

    window.document.title = environment.APP_NAME;

    this.historyService.onPopStateHandlers.push(this.handlePop.bind(this));

    document.getElementById('app-loading').remove();
  }

  ngOnInit(): void {
    this.historySubscription = this.historyService.historySubject.subscribe(history => {
      this.history = history;
      this.updateMenuState();
    });
    this.loginSubscription = this.authService.onLogin.subscribe(() => this.updateMenuState());
    this.logoutSubscription = this.authService.onLogout.subscribe(() => this.updateMenuState());
  }

  private updateMenuState(): void {
    this.menu['disabled'] = !this.authService.isLoggedIn() || this.frameDisabled
      || (this.history[1] && (this.history[0].level || 0) < (this.history[1].level || 0));
  }

  private handlePop(e: PopStateEvent): boolean {
    if (this.menu.opened) {
      this.menu.close();
      return true;
    }
    return false;
  }

  public isActive(path: string): boolean {
    if (path === '' && this.location.path() !== path) {
      return false;
    }
    if (path.indexOf('/') > -1) {
      path = path.substring(0, path.indexOf('/'));
    }
    const index = this.location.path().indexOf(path);

    if (index > -1 && this.location.path()[index + path.length] === '/') {
      return true;
    }

    return this.location.path() === '/' + path || this.location.path() === path;
  }

  ngOnDestroy(): void {}

  showToaster() {
    this.toaster.info(this.translate.instant('MESSAGES.UNAVAILABLE_FUNCTION'));
  }
}
