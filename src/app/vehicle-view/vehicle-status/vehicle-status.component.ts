import { Component, OnDestroy, AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, ViewChild, ElementRef } from '@angular/core';
import { Settings } from '../../settings/settings';
import { VehicleTabComponent } from '../../component-base';
import { AlertService } from '../../service/alert.service';
import { SessionStorage } from 'ngx-webstorage';
import { offsetBounds, longTouch, disableEvent } from 'src/app/util/utils';
import { VehicleService } from 'src/app/service/vehicle.service';
declare const google: any;

@Component({
  selector: 'app-vehicle-status',
  templateUrl: './vehicle-status.component.html',
  styleUrls: ['./vehicle-status.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class VehicleStatusComponent extends VehicleTabComponent implements AfterViewInit, OnDestroy {
  @ViewChild('statusMap') mapElement: ElementRef;
  vehicleData: any;
  private vehicle: any = null;

  readonly keys = Object.keys;
  readonly movingSymbol = Settings.movingSymbol;
  readonly standbySymbol = Settings.standbySymbol;

  todayAlertData: any[] = [];
  vehicleAlertData: {[key: string]: {[key: string]: any[]}} = {};

  private map: any;
  private marker: any;
  GEOFENCING_ALERT_ICON = Settings.GEOFENCING_ALERT_ICON;

  private defaultBounds: { east: number, north: number, west: number, south: number };

  @SessionStorage('map.sharedzoom', 13)
  private overviewZoom: number;

  constructor(private alertService: AlertService,
              private cdr: ChangeDetectorRef,
              private vehicleService: VehicleService) {
    super();
  }

  ngAfterViewInit() {
    super.ngAfterViewInit();
    this.initMap();
    this.refreshMarker();
  }

  private initMap(): void {
    this.map = new google.maps.Map(this.mapElement.nativeElement, {
      center: {lat: 47.49, lng: 19.04},
      zoom: 13,
      mapTypeControl: false,
      zoomControl: false,
      streetViewControl: false,
      disableDefaultUI: true
    });
    this.map.addListener('zoom_changed', () => {
      this.overviewZoom = this.map.zoom;
      if (this.map.zoom > 15) {
        this.map.setMapTypeId('hybrid');
      } else {
        this.map.setMapTypeId('roadmap');
      }
    });
    this.removableSubscriptions.push(
      this.alertService.getTodayAlerts().subscribe(result => {
        this.todayAlertData = result;
        this.vehicleAlertData = {};
        if (this.todayAlertData) {
          this.todayAlertData.forEach(alert => {
            if (alert.data.vehicleId) {
              if (!this.vehicleAlertData[alert.data.vehicleId]) {
                this.vehicleAlertData[alert.data.vehicleId] = {};
              }
              const key = alert.data.icon || Settings.getAlertIcon(alert.alertType);
              if (!this.vehicleAlertData[alert.data.vehicleId][key]) {
                this.vehicleAlertData[alert.data.vehicleId][key] = [];
              }
              this.vehicleAlertData[alert.data.vehicleId][key].push(alert);
            }
          });
          this.cdr.markForCheck();
        }
      })
    );
    longTouch(this.mapElement.nativeElement, () => this.map.fitBounds(this.defaultBounds));
    disableEvent(this.mapElement.nativeElement, 'swipeleft swiperight');
  }

  setVehicleData(vehicleData: any, update: boolean): void {
    this.vehicleData = vehicleData;
    this.cdr.markForCheck();
    this.refreshMarker(update);
    if ( !this.vehicle || this.vehicleData && this.vehicle && this.vehicleData.vehicleId != this.vehicle.id) {
      this.vehicleService.getVehicles().subscribe( vehicles => {
        this.vehicle = vehicles.find(v => v.id ==  vehicleData.vehicleId);
        if (this.vehicle && this.vehicle.fuelCapacity) {
          this.vehicle.fuelCapacityNumber = Number(this.vehicle.fuelCapacity.replace(/[^0-9\.]+/g,""));
          console.log('Max fuel: ', this.vehicle.fuelCapacityNumber)
        }
      });
    }
    console.log('Data: ', this.vehicleData);
  }

  refreshMarker(update?: boolean): void {
    if (this.map && this.vehicleData && this.vehicleData.lat && this.vehicleData.long) {
      const latlng = new google.maps.LatLng(this.vehicleData.lat, this.vehicleData.long);
      if (!this.marker) {
        this.overviewZoom = Math.max(this.overviewZoom, 13);
        this.marker = new google.maps.Marker({
          map: this.map,
          position: latlng,
          title: this.vehicleData.licensePlate,
          icon: this.vehicleData.ignition ? this.movingSymbol : this.standbySymbol
        });
      } else {
        if (!this.marker.getMap()) {
          this.marker.setMap(this.map);
        }
        this.marker.setPosition(latlng);
        this.marker.setIcon(this.vehicleData.ignition ? this.movingSymbol : this.standbySymbol);
      }
      if (!update) {
        setTimeout(() => {
          this.map.setZoom(this.overviewZoom);
          this.map.panTo(latlng);
        });
      }
    } else if (this.map) {
      if (this.marker) {
        this.marker.setMap(null);
      }
      const prevZoom = this.overviewZoom;
      this.map.setZoom(8);
      this.overviewZoom = prevZoom;
    }
    if (this.map && !update) {
      setTimeout(() => this.defaultBounds = offsetBounds(this.map.getBounds()), 500);
    }
  }

  switchEnd(): void {
    if (!this.map) {
      this.initMap();
    }
    this.refreshMarker();
  }

  ngOnDestroy(): void {
    super.ngOnDestroy();
    this.overviewZoom = null;
    longTouch(this.mapElement.nativeElement, undefined, true);
  }
}
