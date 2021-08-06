import { Component, ViewChild, OnDestroy, ChangeDetectionStrategy,
  ChangeDetectorRef, AfterViewInit, ViewChildren, QueryList } from '@angular/core';
import { VehicleService } from '../service/vehicle.service';
import { ActivatedRoute, Params } from '@angular/router';
import { MatTabGroup } from '@angular/material';
import { HistoryService } from '../service/history.service';
import { Subscription } from 'rxjs';
import { VehicleTabComponent } from '../component-base';
import { StringNumberComparator } from '../util/comparators';
import { VehicleSelectorComponent } from '../widget/vehicle-selector/vehicle-selector.component';

@Component({
  selector: 'app-vehicle-view',
  templateUrl: './vehicle-view.component.html',
  styleUrls: ['./vehicle-view.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class VehicleViewComponent implements AfterViewInit, OnDestroy {
  @ViewChild('tabGroup') tabGroup: MatTabGroup;
  @ViewChild('slideMenu') slideMenu: VehicleSelectorComponent;
  @ViewChildren('tab') tabComponents: QueryList<VehicleTabComponent>;
  vehicleData: any[];
  selectedVehicleId: number;
  private paramVehicleId: number;

  private tabNames = ['MENU.VEHICLE_STATUS', 'MENU.VEHICLE_ROUTES', 'MENU.VEHICLE_ALERTS', 'MENU.VEHICLE_REPORTS'];
  private routeSubscription: Subscription;
  private unfilteredSubscription: Subscription;

  private comparator = new StringNumberComparator();

  constructor(private vehicleService: VehicleService,
              private activatedRoute: ActivatedRoute,
              private historyService: HistoryService,
              private cdr: ChangeDetectorRef) { }

  ngAfterViewInit() {
    this.routeSubscription = this.activatedRoute.params.subscribe((params: Params) => {
      if (params['vehicleId']) {
        this.paramVehicleId = Number.parseInt(params['vehicleId'], 10);
      }
      if (params['tab']) {
        this.tabGroup.selectedIndex = Number.parseInt(params['tab'], 10);
      }
      this.changeTab(this.tabGroup.selectedIndex || 0);
    });
    this.unfilteredSubscription = this.vehicleService.getLatestVehicleData().subscribe(res => {
      this.vehicleData = (res || []).sort((a, b) => this.comparator.compare(a, b, 'licensePlate', null, null, null, true));
      if (this.vehicleData && this.vehicleData.length > 0) {
        this.selectVehicle(this.selectedVehicleId || this.paramVehicleId || this.vehicleData[0].vehicleId, this.selectedVehicleId != null);
      }
      this.cdr.markForCheck();
    });
  }

  selectVehicle(vehicleId: number, update: boolean): void {
    if (vehicleId && this.vehicleData && this.vehicleData.length && (update || this.selectedVehicleId !== vehicleId)) {
      this.selectedVehicleId = vehicleId;
      const selectedData = this.vehicleData.find(item => item.vehicleId === this.selectedVehicleId);
      if (this.selectedVehicleId === this.paramVehicleId) {
        this.paramVehicleId = null;
        this.slideMenu.selectVehicle(vehicleId, true);
      }
      if (selectedData) {
        this.tabComponents.forEach((tab: VehicleTabComponent) => tab.setVehicleData(selectedData, update));
      }
    }
  }

  changeTab(index: number): void {
    this.historyService.changeLoc(this.tabNames[index]);
  }

  ngOnDestroy(): void {
    this.routeSubscription.unsubscribe();
    this.unfilteredSubscription.unsubscribe();
  }

}
