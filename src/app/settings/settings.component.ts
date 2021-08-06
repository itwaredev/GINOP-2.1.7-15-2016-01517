import { Component, OnInit } from '@angular/core';
import { Settings } from './settings';
import { VehicleService } from '../service/vehicle.service';
import { range } from '../util/utils';
import { FormControl } from '@angular/forms';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.scss']
})
export class SettingsComponent implements OnInit {

  private readonly rangeState = ((control: FormControl | null): boolean | null => {
    if (!control.value || !control.parent) {
      return null;
    }
    const parts = Object.keys(control.parent.controls).find(key => control.parent.controls[key] === control).split(',');
    parts[3] = parts[3] === 'start' ? 'end' : 'start';
    const sibling = control.parent.controls[parts.join(',')];
    if (sibling.value != null &&
      (parts[3] === 'start' && control.value < sibling.value
        || parts[3] === 'end' && control.value > sibling.value)) {
        return true;
    }
    return null;
  });

  settings = Settings;
  private readonly range = range(0, 24).map(el => el * 60);
  private validity = true;
  private readonly dayOptions = [
    {name: '0MONDAY', value: 'MONDAY'},
    {name: '1TUESDAY', value: 'TUESDAY'},
    {name: '2WEDNESDAY', value: 'WEDNESDAY'},
    {name: '3THURSDAY', value: 'THURSDAY'},
    {name: '4FRIDAY', value: 'FRIDAY'},
    {name: '5SATURDAY', value: 'SATURDAY'},
    {name: '6SUNDAY', value: 'SUNDAY'}
  ];
  private saveTimer: any;
  metadata = {
    name: 'settings',
    groups: [{
      title: 'GENERAL',
      fields: [
        {
          name: 'VEHICLE_DATA_REFRESH_INTERVAL',
          type: 'select',
          sortByValue: true,
          options: [30000, 60000, 120000, 300000]
        },
        {
          name: 'MAP_SHOWN_DETAILS',
          type: 'multiselect',
          objectLabelField: 'name',
          options: [
            {name: 'licensePlate', value: 'licensePlate'},
            {name: 'vehicleName', value: 'name'},
            {name: 'driverName', value: 'driverName'}
          ]
        }
      ]
    },
    {
      title: 'WORKING_HOURS',
      fields: [
        {
          name: 'WORKING_TIMEZONE',
          type: 'text',
          readOnly: true
        },
        {
          name: 'WORKING_DAYS',
          type: 'multiselect',
          objectLabelField: 'name',
          sortByValue: true,
          options: this.dayOptions
        },
        {
          name: 'WORKING_HOURS',
          type: 'multiline',
          linkto: 'WORKING_DAYS',
          options: [],
          format: (v) => (v < 600 ? '0' + v / 60 : v / 60) + ':00',
          sectionSort: (a, b) =>
            this.dayOptions.findIndex(val => val.value === a) < this.dayOptions.findIndex(val => val.value === b) ? -1 : 1,
          fields: [
            {
              name: 'start',
              options: this.range,
              validators: {required: true, range: this.rangeState}
            },
            {
              name: 'end',
              options: this.range,
              validators: {required: true, range: this.rangeState}
            }
          ]
        }
      ]
    }]
  };

  constructor(private vehicleService: VehicleService) { }

  ngOnInit() {
  }

  setValidity(validity: boolean): void {
    this.validity = validity;
  }

  settingsChanged(param: {key: string, subEntityName: string}): void {
    if (param.key === 'MAP_SHOWN_DETAILS') {
      this.settings.MAP_SHOWN_DETAILS = this.settings.MAP_SHOWN_DETAILS.sort((a, b) => {
        const aInd = (this.metadata.groups[0].fields[1].options as ({name: string, value: string}[])).findIndex(item => item.value === a);
        const bInd = (this.metadata.groups[0].fields[1].options as ({name: string, value: string}[])).findIndex(item => item.value === b);
        return aInd < bInd ? -1 : 1;
      });
    }
    if (param.key === 'VEHICLE_DATA_REFRESH_INTERVAL') {
      this.vehicleService.reinit();
    }
    if (param.key === 'WORKING_HOURS') {
      if (this.saveTimer) {
        clearTimeout(this.saveTimer);
        this.saveTimer = null;
        localStorage.removeItem('tmpWorkingHours');
      }
      if (this.validity) {
        localStorage.setItem('tmpWorkingHours', JSON.stringify(Settings.WORKING_HOURS));
        this.saveTimer = setTimeout(() => {
          this.vehicleService.authService.saveWorkingHours();
        }, 5000);
      }
    }
  }

}
