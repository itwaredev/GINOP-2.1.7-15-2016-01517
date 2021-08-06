import { Component, OnInit, OnDestroy, Input } from '@angular/core';
import { LoadingProgressService, LoadingState } from './loading-progress.service';
import { MatSnackBar, MatSnackBarRef } from '@angular/material';
import { TranslateService } from '@ngx-translate/core';
import { Settings } from '../../settings/settings';
import { Subscription } from 'rxjs';
import { first } from 'rxjs/operators';

@Component({
  selector: 'app-loading-indicator',
  templateUrl: './loading-indicator.component.html',
  styleUrls: ['./loading-indicator.component.css']
})
export class LoadingIndicatorComponent implements OnInit, OnDestroy {

  @Input() loaded = true;
  private serviceSubscription: Subscription;

  private shownMessage: string;

  constructor(private loadingProgressService: LoadingProgressService, private snackBar: MatSnackBar, private translate: TranslateService) {
    this.serviceSubscription = this.loadingProgressService.subscribe(stateChange => {
      this.loaded = stateChange.allInProgress === 0;
      if (stateChange.state === LoadingState.ERROR) {
        const errorMsg = 'MESSAGES.' + stateChange.message || 'UNKNOWN';
        let translatedMessage = this.translate.instant('MESSAGES.' + stateChange.message);
        if (errorMsg === translatedMessage) {
          translatedMessage = this.translate.instant('MESSAGES.UNKNOWN');
        }
        if (this.shownMessage !== translatedMessage) {
          this.listen(
            this.snackBar.open(
              `${this.translate.instant('MESSAGES.ERROR')}: ${translatedMessage}`,
              this.translate.instant('MESSAGES.OK'),
              {
                duration: !stateChange.callback ? Settings.WARNING_DURATION : null
              }
            ),
            translatedMessage,
            stateChange.callback
          );
        }
      } else if (stateChange.state === LoadingState.COMPLETED && stateChange.message) {
        const translateKey = 'RESPONSES.' + stateChange.message;
        let message = this.translate.instant(translateKey);
        if (message === translateKey) {
          message = this.translate.instant('RESPONSES.SUCCESS');
        }
        if (this.shownMessage !== message) {
          this.listen(
            this.snackBar.open(message, this.translate.instant('MESSAGES.OK'), {
              duration: !stateChange.callback ? Settings.WARNING_DURATION : null
            }),
            message,
            stateChange.callback
          );
        }
      }
    });
  }

  private listen<T>(snack: MatSnackBarRef<T>, message: string, callback?: Function): void {
    snack.afterOpened().pipe(first()).subscribe(_ => this.shownMessage = message);
    snack.afterDismissed().pipe(first()).subscribe(info => {
      this.shownMessage = null;
      if (info.dismissedByAction && callback) {
        callback();
      }
    });
  }

  ngOnInit() {
  }

  ngOnDestroy() {
    if (this.serviceSubscription) {
      this.serviceSubscription.unsubscribe();
    }
    this.serviceSubscription = null;
  }
}
