import { Component, OnInit, Output, EventEmitter, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { VehicleService } from '../../service/vehicle.service';
import { first } from 'rxjs/operators';
import { StringNumberComparator } from 'src/app/util/comparators';
import { HistoryService } from 'src/app/service/history.service';
import { FormForModelComponent } from 'src/app/widget/form-for-model/form-for-model.component';
import { AuthService } from 'src/app/auth/auth.service';

@Component({
  selector: 'app-vehicle-filter',
  templateUrl: './vehicle-filter.component.html',
  styleUrls: ['./vehicle-filter.component.scss']
})
export class VehicleFilterComponent implements OnInit, OnDestroy {
  @ViewChild('form') form: FormForModelComponent;
  @Output() closeFilter = new EventEmitter();

  metadata = {
    name: 'filter_vehicle',
    fields: [
      {
        name: 'licensePlate',
        type: 'multiselect',
        notranslate: true,
        objectLabelField: 'licensePlate',
        objectValueField: 'id',
        options: []
      },
      {
        name: 'driverName',
        type: 'multiselect',
        notranslate: true,
        objectLabelField: 'name',
        objectValueField: 'id',
        options: []
      },
      {
        name: 'group',
        type: 'multiselect',
        notranslate: true,
        objectLabelField: 'name',
        objectValueField: 'switches',
        options: []
      }
    ]
  };

  protected validity = false;
  private comparator = new StringNumberComparator();
  private isActive = false;

  hasActiveFilter = false;
  private saveTimer: any;

  constructor(public vehicleService: VehicleService, private historyService: HistoryService,
    private authService: AuthService, private host: ElementRef) {
    this.vehicleService.onFilterChanged.subscribe(_ => {
      this.hasActiveFilter = Object.keys(this.vehicleService.filters)
        .filter(key => this.vehicleService.filters[key] && this.vehicleService.filters[key].length)
        .length > 0;
    });
    this.historyService.onPopStateHandlers.push(this.handlePop.bind(this));
    this.authService.onLogin.subscribe(_ => this.init());
    this.authService.onLogout.subscribe(_ => {
      this.close();
      this.clean();
    });
  }

  private handlePop(e: PopStateEvent): boolean {
    const ret = this.isActive;
    this.close();
    return ret;
  }

  ngOnInit(): void {
    this.init();
  }

  private init(): void {
    this.clean();
    this.vehicleService.getVehicles().pipe(first())
    .subscribe(res => res.sort((a, b) => this.comparator.compare(a, b, 'licensePlate', null, false, false, true))
      .forEach(item => this.metadata.fields[0].options.push(item)));
    this.vehicleService.getGroups().pipe(first())
    .subscribe(res => res.sort((a, b) => this.comparator.compare(a, b, 'name', null, false, false, true))
      .forEach(item => this.metadata.fields[2].options.push(item)));
    this.vehicleService.getDrivers().pipe(first())
    .subscribe(res => res.sort((a, b) => this.comparator.compare(a, b, 'name', null, false, false, true))
      .forEach(item => this.metadata.fields[1].options.push(item)));
  }

  private clean(): void {
    this.metadata.fields[0].options.length = 0;
    this.metadata.fields[1].options.length = 0;
    this.metadata.fields[2].options.length = 0;
  }

  clear(): void {
    this.vehicleService.clearFilter();
  }

  filterChanged(): void {
    if (this.saveTimer) {
      clearTimeout(this.saveTimer);
      this.saveTimer = null;
    }
    this.saveTimer = setTimeout(() => {
      if (this.isActive) {
        this.vehicleService.filters = undefined;
      }
    }, 200);
  }

  onOpen(): void {
    this.isActive = true;
  }

  close(): void {
    if (this.isActive) {
      this.form.close();
      this.isActive = false;
      this.closeFilter.emit();
      this.host.nativeElement.click();
    }
  }

  ngOnDestroy(): void {
    this.metadata.fields[0].options.length = 0;
    this.metadata.fields[1].options.length = 0;
    this.metadata.fields[2].options.length = 0;
  }
}
