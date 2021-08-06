import { Component, OnInit, ViewChild, TemplateRef, Input, OnChanges, SimpleChanges, Output, EventEmitter } from '@angular/core';
import { TabComponent } from 'src/app/component-base';
import { AlertService } from 'src/app/service/alert.service';
import { SmartTableComponent, ColumnConfig } from 'src/app/widget/smart-table/smart-table.component';
import { MatDialog, MatDialogRef } from '@angular/material';
import { ConfirmDialogComponent } from 'src/app/widget/confirm.dialog';

@Component({
  selector: 'app-contact',
  templateUrl: './contact.component.html',
  styleUrls: ['./contact.component.scss'],
})
export class ContactComponent extends TabComponent implements OnInit, OnChanges {
  @ViewChild('table') table: SmartTableComponent;
  @ViewChild('typeCell') typeCell: TemplateRef<any>;
  @ViewChild('deleteCell') deleteCell: TemplateRef<any>;
  @Input() users: any[];
  @Input() contacts: any[];
  @Output() contactModified = new EventEmitter();

  metadata = {
    name: 'alert.contact',
    fields: [
      {
        name: 'contactType',
        type: 'select',
        options: ['email', 'sms', 'push'],
        clearOnChange: ['contact']
      },
      {
        name: 'contact',
        type: 'text',
        dependsOn: 'contactType',
        dependsOnValue: ['email', 'sms'],
        validators: {required: true}
      },
      {
        name: 'contact',
        type: 'object-select',
        dependsOn: 'contactType',
        dependsOnValue: 'push',
        objectLabelField: 'personName',
        objectValueField: 'id',
        options: [],
        validators: {required: true}
      }
    ]
  };

  columns: (string | ColumnConfig)[];

  private dialogRef: MatDialogRef<ConfirmDialogComponent>;
  private dummyUser = {personName: ''};
  private newContact: any;

  constructor(private alertService: AlertService, public dialog: MatDialog) {
    super();
  }

  ngOnInit() {
    this.columns = [
      { name: 'contact', dataFormatter: contact => contact.contactType === 'push' ?
        (this.users.find(user => user.id === contact.contact) || this.dummyUser).personName :
        contact.contact
      },
      { name: 'contactType', template: this.typeCell },
      { name: 'action.delete', template: this.deleteCell, visible: false, actionColumn: true }
    ];
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['users']) {
      this.metadata.fields[1].options = this.users;
    }
  }

  addContact(): void {
    if (!this.newContact) {
      this.newContact = {contact: '', contactType: 'email'};
      this.contacts.unshift(this.newContact);
      this.table.select(this.newContact);
    }
  }

  saveContact(contact: any): void {
    if (!contact.contact || contact.contactType === 'push' && !this.users.find(user => user.id === contact.contact)) {
      return;
    }
    if (this.newContact === contact) {
      this.newContact = null;
    }
    this.alertService.saveContact(contact).subscribe(res => {
      if (res) {
        contact.id = res;
        this.table.select(contact);
        this.contactModified.emit();
      } else {
        this.contacts.splice(this.contacts.indexOf(contact), 1);
      }
    });
  }

  deleteContact(contact: any): void {
    if (!contact.id) {
      this.newContact = null;
      this.contacts.splice(this.contacts.indexOf(contact), 1);
      return;
    }
    if (!this.dialogRef) {
      this.dialogRef = this.dialog.open(ConfirmDialogComponent, {disableClose: true, data: {title: 'ACTION.CONFIRMATION_DELETE'}});
      this.dialogRef.afterClosed().subscribe(dialogActionResult => {
        if (dialogActionResult) {
          this.alertService.deleteContact(contact).subscribe(res => {
            if (res) {
              this.contacts.splice(this.contacts.indexOf(contact), 1);
              this.contactModified.emit();
            }
          });
        }
        this.dialogRef = undefined;
      });
    }
  }

}
