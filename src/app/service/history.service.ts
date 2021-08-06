import { Injectable } from '@angular/core';
import { ReplaySubject } from 'rxjs';
import { Router, ActivationEnd, Data } from '@angular/router';
import { filter } from 'rxjs/operators';
import { Platform } from '@ionic/angular';
import { AuthService } from '../auth/auth.service';

@Injectable()
export class HistoryService {
  readonly historySubject = new ReplaySubject<Data[]>(1);
  private history: Data[] = [];

  readonly onPopStateHandlers: ((e: PopStateEvent) => boolean)[] = [];
  readonly stateStack: {state: any, title: string, url?: any}[] = [];
  private prevState = false;

  constructor(private router: Router, private platform: Platform, private authService: AuthService) {
    this.authService.onLogout.subscribe(_ => {
      this.stateStack.length = 0;
      setTimeout(
        () => window.history.pushState(window.history.state, window.document.title, window.location.href)
        , 1000
      );
    });
    this.router.events.pipe(
      filter(event => event instanceof ActivationEnd)
    ).subscribe((res: ActivationEnd) => {
      this.history.push(res.snapshot.data);
      if (this.history.length > 2) {
        this.history = this.history.slice(this.history.length - 2);
      }
      this.historySubject.next(this.history);
    });

    this.platform.backButton.subscribeWithPriority(1000, () => {
      this.back();
    });

    window.onpopstate = (e: PopStateEvent) => {
      const caught = this.onPopStateHandlers.find(handler => handler(e));

      const last = this.stateStack.pop();
      if (caught) {
        window.history.protoPushState(last.state, last.title, last.url);
        this.stateStack.push(last);
      } else if (this.stateStack.length || this.prevState) {
        if (this.prevState) {
          window.history.protoPushState(last.state, last.title, last.url);
          this.stateStack.push(last);
          this.prevState = false;
        } else {
          this.prevState = true;
          this.back();
        }
      } else if (!this.platform.platforms().includes('android') && !this.platform.platforms().includes('ios')) {
        this.back();
      } else {
        navigator['app'].exitApp();
      }
    };
    window.onpushstate = (state, title, url) => {
      if (this.stateStack.length && this.stateStack[this.stateStack.length - 1].url.includes('login')) {
        this.stateStack.pop();
      }
      this.stateStack.push({state, title, url});
      window.history.replaceState(state, title, url);
    };
    setTimeout(
      () => window.history.pushState(window.history.state, window.document.title, window.location.href)
      , 100
    );
  }

  changeLoc(locationKey: string): void {
    if (locationKey) {
      this.history[this.history.length - 1].title = locationKey;
      this.historySubject.next(this.history);
    }
  }

  back(): void {
    window.history.back();
  }
}
