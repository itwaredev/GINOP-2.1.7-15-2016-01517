import { Component, OnInit, ViewChild, TemplateRef, Input, OnChanges, SimpleChanges, EventEmitter, Output } from '@angular/core';
import { TabComponent } from 'src/app/component-base';
import { SmartTableComponent, ColumnConfig } from 'src/app/widget/smart-table/smart-table.component';
import { AlertService } from 'src/app/service/alert.service';
import { MatDialog, MatDialogRef } from '@angular/material';
import { ConfirmDialogComponent } from 'src/app/widget/confirm.dialog';

@Component({
  selector: 'app-reminder-setup',
  templateUrl: './reminder-setup.component.html',
  styleUrls: ['./reminder-setup.component.scss'],
})
export class ReminderSetupComponent extends TabComponent implements OnInit, OnChanges {
  @ViewChild('table') table: SmartTableComponent;
  @ViewChild('deleteCell') deleteCell: TemplateRef<any>;
  @Input() users: any[];
  @Input() contacts: any[];
  @Output() setupClick: EventEmitter<void> = new EventEmitter();

  metadata = {
    name: 'alert.reminder',
    fields: [
      {
        name: 'contactIds',
        displayName: 'contact',
        type: 'multiselect',
        objectLabelField: 'name',
        objectValueField: 'id',
        options: []
      },
      {
        name: 'date',
        type: 'datepicker',
        minDate: new Date().addDates(1),
        validators: {required: true}
      },
      {
        name: 'name',
        displayName: 'message',
        type: 'textarea',
        validators: {required: true}
      }
    ]
  };

  columns: (string | ColumnConfig)[];
  staticAlerts: any[] = [];
  loaded:boolean = false;

  private dialogRef: MatDialogRef<ConfirmDialogComponent>;
  private dummyUser = {personName: ''};
  private newReminder: any;

  constructor(private alertService: AlertService, public dialog: MatDialog) {
    super();
  }

  ngOnInit() {
    this.columns = [
      { name: 'date' },
      { name: 'name', displayName: 'message' },
      { name: 'action.delete', template: this.deleteCell, visible: false, actionColumn: true }
    ];
    this.alertService.getStatics().subscribe(res => {
      this.staticAlerts = res;
      this.loaded = true;
      this.staticAlerts.forEach(stat => {
        const cronParts = stat.cron.split(' ').filter(p => p !== '?').map(p => Number.parseInt(p, 10));
        if (cronParts.length === 6) {
          stat.date = new Date(cronParts[5], cronParts[4] - 1, cronParts[3], cronParts[2], cronParts[1], cronParts[0], 0);
        }
      });
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['contacts'] || changes['users']) {
      this.metadata.fields[0].options = this.contacts.map(contact => {
        return {
          id: contact.id,
          name: contact.contactType === 'push' ?
            (this.users.find(user => user.id === contact.contact) || this.dummyUser).personName :
            contact.contact
        };
      });
    }
  }

  addReminder(): void {
    if (!this.newReminder) {
      this.newReminder = { date: new Date().addDates(1).toStartOfDay(), timezone: Intl.DateTimeFormat().resolvedOptions().timeZone };
      this.staticAlerts.unshift(this.newReminder);
      this.table.select(this.newReminder);
    }
  }

  saveReminder(reminder: any): void {
    if (!reminder.date || !reminder.name) {
      return;
    }
    if (this.newReminder === reminder) {
      this.newReminder = null;
    }

    const toSave = {...reminder};
    const date = toSave.date;
    toSave.cron =
      `${date.getSeconds()} ${date.getMinutes()} ${date.getHours()} ${date.getDate()} ${date.getMonth() + 1} ? ${date.getFullYear()}`;
    delete toSave.date;
    this.alertService.saveStatic(toSave).subscribe(res => {
      if (res) {
        reminder.id = res;
        this.table.select(reminder);
      } else {
        this.staticAlerts.splice(this.staticAlerts.indexOf(reminder), 1);
      }
    });
  }

  deleteReminder(reminder: any): void {
    if (!reminder.id) {
      this.newReminder = null;
      this.staticAlerts.splice(this.staticAlerts.indexOf(reminder), 1);
      return;
    }
    if (!this.dialogRef) {
      this.dialogRef = this.dialog.open(ConfirmDialogComponent, {disableClose: true, data: {title: 'ACTION.CONFIRMATION_DELETE'}});
      this.dialogRef.afterClosed().subscribe(dialogActionResult => {
        if (dialogActionResult) {
          this.alertService.deleteStatic(reminder).subscribe(res => {
            if (res) {
              this.staticAlerts.splice(this.staticAlerts.indexOf(reminder), 1);
            }
          });
        }
        this.dialogRef = undefined;
      });
    }
  }
}
