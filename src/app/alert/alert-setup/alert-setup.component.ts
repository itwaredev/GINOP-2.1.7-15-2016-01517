import { Component, OnInit, ViewChild, TemplateRef, Input, OnChanges, SimpleChanges, Output, EventEmitter } from '@angular/core';
import { TabComponent } from 'src/app/component-base';
import { SmartTableComponent, ColumnConfig } from 'src/app/widget/smart-table/smart-table.component';
import { MatDialogRef, MatDialog } from '@angular/material';
import { AlertService } from 'src/app/service/alert.service';
import { ConfirmDialogComponent } from 'src/app/widget/confirm.dialog';
import { VehicleService } from 'src/app/service/vehicle.service';
import { first } from 'rxjs/operators';
import { StringNumberComparator } from 'src/app/util/comparators';

@Component({
  selector: 'app-alert-setup',
  templateUrl: './alert-setup.component.html',
  styleUrls: ['./alert-setup.component.scss'],
})
export class AlertSetupComponent extends TabComponent implements OnInit, OnChanges {
  @ViewChild('table') table: SmartTableComponent;
  @ViewChild('deleteCell') deleteCell: TemplateRef<any>;
  @Input() users: any[];
  @Input() contacts: any[];
  @Output() setupClick: EventEmitter<void> = new EventEmitter();

  private comparator = new StringNumberComparator();

  metadataBase = {
    name: 'alert.setup',
    fields: [
      {
        name: 'id',
        type: 'text',
        dependsOn: () => false
      },
      {
        name: 'alertTemplateId',
        displayName: 'type',
        type: 'object-select',
        dependsOn: '!id',
        objectLabelField: 'name',
        objectValueField: 'id',
        options: [],
        validators: {required: true}
      },
      {
        name: 'contactIds',
        displayName: 'contact',
        type: 'multiselect',
        objectLabelField: 'name',
        objectValueField: 'id',
        options: []
      },
      {
        name: 'vehicleIds',
        displayName: 'vehicles',
        type: 'multiselect',
        objectLabelField: 'licensePlate',
        objectValueField: 'id',
        options: []
      },
      {
        name: 'alertMessage',
        type: 'text',
        validators: {required: true}
      }
    ]
  };

  metadataParams = {
    name: 'alert.setup',
    fields: []
  };

  columns: (string | ColumnConfig)[];
  private alertTemplates: any[] = [];
  alertConfigs: any[] = [];
  loaded:boolean = false;

  private dialogRef: MatDialogRef<ConfirmDialogComponent>;
  private dummyUser = {personName: ''};
  private dummyTemplate = {name: ''};
  selectedRow: any;
  private newConfig: any;

  constructor(private vehicleService: VehicleService, private alertService: AlertService, public dialog: MatDialog) {
    super();
  }

  ngOnInit() {
    this.columns = [
      { name: 'name', displayName: 'type', dataFormatter: config => config.name ||
        (this.alertTemplates.find(t => t.id === config.alertTemplateId) || this.dummyTemplate).name
      },
      'alertMessage',
      { name: 'action.delete', template: this.deleteCell, visible: false, actionColumn: true }
    ];
    this.alertService.getTemplates().subscribe(res => {
      this.alertTemplates = res;
      this.metadataBase.fields[1].options = this.alertTemplates;
      this.alertTemplates.forEach(template => {
        template.params = {};
        const matches = template.alertAction.match(/:[^ |;|&|\|]*/g);
        if (matches) {
          matches.forEach(match => template.params[match.substring(1)] = null);
        }
      });
    });
    this.alertService.getConfigs().subscribe(res => {
      this.alertConfigs = res;
      this.loaded = true;
    });
    this.vehicleService.getVehicles().pipe(first()).subscribe(res =>
      this.metadataBase.fields[3].options = res.sort((a, b) => this.comparator.compare(a, b, 'licensePlate', null, false, false, true))
    );
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['contacts'] || changes['users']) {
      this.metadataBase.fields[2].options = this.contacts.map(contact => {
        return {
          id: contact.id,
          name: contact.contactType === 'push' ?
            (this.users.find(user => user.id === contact.contact) || this.dummyUser).personName :
            contact.contact
        };
      });
    }
  }

  selectRow(row: any): void {
    this.selectedRow = row;
    this.updateParams();
  }

  rowChanged(fieldName: string): void {
    if (fieldName === 'alertTemplateId') {
      this.updateParams();
    }
  }

  private updateParams(): void {
    if (this.selectedRow) {
      const template = this.alertTemplates.find(t => t.id === this.selectedRow.alertTemplateId);
      const fields = [];
      if (template) {
        Object.keys(template.params).forEach(key => {
          this.selectedRow.params[key] = this.selectedRow.params[key] || null;
          fields.push({ type: 'number', name: key, validators: { required: true, min: 0 } });
        });
      }
      this.metadataParams = { name: 'alert.setup', fields };
    }
  }

  addConfig(): void {
    if (!this.newConfig) {
      this.newConfig = { params: {} };
      this.alertConfigs.unshift(this.newConfig);
      this.table.select(this.newConfig);
    }
  }

  saveConfig(config: any): void {
    if (!config.alertTemplateId || !config.alertMessage) {
      return;
    }
    if (this.newConfig === config) {
      this.newConfig = null;
    }
    this.alertService.saveConfig(config).subscribe(res => {
      if (res) {
        config.id = res;
        this.table.select(config);
      } else {
        this.alertConfigs.splice(this.alertConfigs.indexOf(config), 1);
      }
    });
  }

  deleteConfig(config: any): void {
    if (!config.id) {
      this.newConfig = null;
      this.alertConfigs.splice(this.alertConfigs.indexOf(config), 1);
      return;
    }
    if (!this.dialogRef) {
      this.dialogRef = this.dialog.open(ConfirmDialogComponent, {disableClose: true, data: {title: 'ACTION.CONFIRMATION_DELETE'}});
      this.dialogRef.afterClosed().subscribe(dialogActionResult => {
        if (dialogActionResult) {
          this.alertService.deleteConfig(config).subscribe(res => {
            if (res) {
              this.alertConfigs.splice(this.alertConfigs.indexOf(config), 1);
            }
          });
        }
        this.dialogRef = undefined;
      });
    }
  }
}
