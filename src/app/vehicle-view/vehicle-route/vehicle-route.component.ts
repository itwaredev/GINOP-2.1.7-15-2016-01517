import { Component, AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, ElementRef, OnDestroy, ViewChild } from '@angular/core';
import { VehicleService } from '../../service/vehicle.service';
import { first } from 'rxjs/operators';
import { VehicleTabComponent } from '../../component-base';
import { TranslateService } from '@ngx-translate/core';
import { Settings } from 'src/app/settings/settings';
import { longTouch, offsetBounds, disableEvent } from 'src/app/util/utils';
declare const google: any;

@Component({
  selector: 'app-vehicle-route',
  templateUrl: './vehicle-route.component.html',
  styleUrls: ['./vehicle-route.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class VehicleRouteComponent extends VehicleTabComponent implements AfterViewInit, OnDestroy {
  @ViewChild('routeMap') mapElement: ElementRef;
  vehicleData: any;
  routeData: any[];
  waypoints: any[] = [];
  waypointLabel: string;

  map: any;
  markers = [];
  infoWindows = {};
  route: any;

  private vehicleChanged;
  private active = false;

  firstTouch;
  splitterLoc = 35;
  fullScreen = false;
  private bindedHandle = this.handleMouse.bind(this);
  private defaultBounds: { east: number, north: number, west: number, south: number };
  selectedDate = new Date().toStartOfDay();
  selectedToDate = new Date(this.selectedDate).addDates(1);
  maxDate = this.selectedDate;
  readonly driverList = {};

  constructor(private vehicleService: VehicleService,
              private cdr: ChangeDetectorRef,
              private element: ElementRef,
              private translateService: TranslateService) {
    super();
    this.vehicleService.getDrivers().pipe(first()).subscribe(res => res.forEach(driver => this.driverList[driver.id] = driver));
  }

  ngOnDestroy() {
    super.ngOnDestroy();
    longTouch(this.mapElement.nativeElement, undefined, true);
  }

  ngAfterViewInit() {
    super.ngAfterViewInit();
    if (this.mapElement.nativeElement) {
      this.initMap();
    }
  }

  private initMap(): void {
    this.map = new google.maps.Map(this.mapElement.nativeElement, {
      center: {lat: 47.49, lng: 19.04},
      zoom: 8,
      mapTypeControl: false,
      zoomControl: false,
      streetViewControl: false
    });
    this.map.addListener('zoom_changed', () => {
      if (this.map.zoom > 15) {
        this.map.setMapTypeId('hybrid');
      } else {
        this.map.setMapTypeId('roadmap');
      }
    });

    setTimeout(() => this.defaultBounds = offsetBounds(this.map.getBounds()), 500);
    const screenChangeHandler = _ => {
      this.fullScreen = !this.fullScreen;
      this.cdr.markForCheck();
    };
    window.document.addEventListener('fullscreenchange', screenChangeHandler);
    window.document.addEventListener('webkitfullscreenchange', screenChangeHandler);
    longTouch(this.mapElement.nativeElement, () => this.map.fitBounds(this.defaultBounds));
    disableEvent(this.mapElement.nativeElement, 'swipeleft swiperight');
  }

  setVehicleData(vehicleData: any, update: boolean): void {
    this.vehicleData = vehicleData;
    this.vehicleChanged = !update;
    this.vehicleService.getWaypoints(vehicleData.vehicleId, this.selectedDate, this.selectedToDate, update)
      .pipe(first())
      .subscribe(result => {
        this.routeData = result;
        if (this.routeData) {
          this.routeData = this.routeData.filter(data => data.longitude && data.latitude).sort((a, b) => {
            const aTime = a.gpsTime || a.arrivaltime;
            const bTime = b.gpsTime || b.arrivaltime;
            if (aTime < bTime) {
              return -1;
            } else if (aTime > bTime) {
              return 1;
            } else {
              return 0;
            }
          });
        }
        this.drawRouteData();
    });
  }

  drawRouteData() {
    if (this.route) {
      this.route.setMap(null);
      this.route = undefined;
    }
    this.markers.forEach(marker => marker.setMap(null));
    this.markers = [];
    this.waypoints = [];
    if (this.routeData && this.map) {
      const dataset = [];
      let maxX = -180, minX = 180, maxY = -90, minY = 90;
      this.routeData.forEach(data => {
        data.latLng = {lat: data.latitude, lng: data.longitude};
        maxX = Math.max(maxX, data.longitude);
        minX = Math.min(minX, data.longitude);
        maxY = Math.max(maxY, data.latitude);
        minY = Math.min(minY, data.latitude);
        if (data.dist != null) {
          this.waypoints.push(data);
        }
        if (!data.arrivaltime || data.arrivaltime < this.selectedToDate.getTime()) {
          dataset.push(data);
        }
      });

      if (this.vehicleChanged && this.active && dataset.length) {
        this.defaultBounds = { east: maxX, north: maxY, west: minX, south: minY };
        this.vehicleChanged = !this.active;
        this.map.fitBounds(this.defaultBounds);
      }
      this.waypoints.forEach((waypoint, index) => {
        if (waypoint.latitude && waypoint.longitude && waypoint.arrivaltime < this.selectedToDate.getTime()) {
          const marker = new google.maps.Marker({
            map: this.map,
            position: new google.maps.LatLng(waypoint.latitude, waypoint.longitude),
            label: { text: (index + 1).toString(), color: 'white' },
            icon: Settings.movingSymbol,
            zIndex: this.waypoints.length - index + 10
          });
          this.markers.push(marker);
          
          google.maps.event.addListener(marker, 'click', (function(marker, id) {
            return function() {
              const el = document.getElementById("wp." + id);
              el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
          })(marker, waypoint.id));
        }
      });
      this.route = new google.maps.Polyline({
        map: this.map,
        path: dataset.map(data => data.latLng),
        geodesic: true,
        strokeColor: '#89bf42',
        strokeOpacity: 1.0,
        strokeWeight: 3
      });
    }
    if (!this.vehicleData) {
      this.waypointLabel = this.translateService.instant('VEHICLE_DATA.NO_DATA');
    } else if (!this.routeData) {
      this.waypointLabel = this.translateService.instant('VEHICLE_DATA.NO_MOVE_YET');
    } else if (this.waypoints.length === 0) {
      this.waypointLabel = this.translateService.instant('VEHICLE_DATA.NO_STOP_WITHIN_PERIOD');
    }
    this.cdr.markForCheck();
  }

  switchEnd(): void {
    if (!this.map) {
      this.initMap();
    }
    this.active = true;
    this.drawRouteData();
  }

  switchOut(): void {
    this.active = false;
  }

  pointClicked(point: any) {
    this.map.panTo(point.latLng);
  } 

  handleMouse(event: any): void {
    if (event.type === 'touchstart' || event.type === 'mousedown') {
      event.preventDefault();
      this.firstTouch = (event.touches || [event])[0];
      this.firstTouch.firstLoc = this.splitterLoc;
      document.body.addEventListener('touchend', this.bindedHandle);
      document.body.addEventListener('touchmove', this.bindedHandle);
      document.body.addEventListener('mouseup', this.bindedHandle);
      document.body.addEventListener('mousemove', this.bindedHandle);
      this.cdr.markForCheck();
    } else if (event.type === 'touchend' || event.type === 'mouseup') {
      this.firstTouch = null;
      document.body.removeEventListener('touchend', this.bindedHandle);
      document.body.removeEventListener('touchmove', this.bindedHandle);
      document.body.removeEventListener('mouseup', this.bindedHandle);
      document.body.removeEventListener('mousemove', this.bindedHandle);
      this.cdr.markForCheck();
    } else if ((event.type === 'touchmove' || event.type === 'mousemove') && this.firstTouch) {
      const appPx = (this.element.nativeElement.offsetHeight || this.element.nativeElement.offsetParent.offsetHeight);
      const movement = ((event.touches || [event])[0].clientY - this.firstTouch.clientY);
      this.splitterLoc = Math.min(100, Math.max(0, this.firstTouch.firstLoc - (movement / appPx) * 100));
      this.cdr.markForCheck();
    }
  }

  dateSelect(date: Date): void {
    this.selectedDate = date;
    this.selectedToDate = new Date(this.selectedDate).addDates(1);
    this.setVehicleData(this.vehicleData, false);
  }
}
