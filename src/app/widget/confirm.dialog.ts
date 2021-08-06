import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-confirm-dialog',
  template: `
    <div style="margin-bottom: 1rem; text-align: center;" innerHTML="{{title | translate}}"></div>
    <div class="right">
        <button type="button" mat-raised-button color="primary" (click)="dialogRef.close(true)" style="margin-right: 0.5rem;">
            {{ 'ACTION.YES' | translate }}
        </button>
        <button type="button" mat-raised-button color="dark" (click)="dialogRef.close()">
            {{ 'ACTION.CANCEL' | translate }}
        </button>
    </div>
  `,
})
export class ConfirmDialogComponent {

  title:string; 
  constructor(
    public dialogRef: MatDialogRef<ConfirmDialogComponent>, 
    @Inject(MAT_DIALOG_DATA) data ) {

    this.title = (data || {title: 'ACTION.CONFIRMATION_NOTICE'}).title || 'ACTION.CONFIRMATION_NOTICE';
  }
}
