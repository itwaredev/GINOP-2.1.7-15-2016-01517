import {
  Component,
  OnDestroy,
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  ViewChild,
  ElementRef
} from '@angular/core';
import { VehicleService } from '../../service/vehicle.service';
import { Settings } from '../../settings/settings';
import { TabComponent } from '../../component-base';
import { Router } from '@angular/router';
import { SessionStorage } from 'ngx-webstorage';
import { offsetBounds, longTouch, disableEvent } from 'src/app/util/utils';
declare const google: any;
declare const MarkerClusterer: any;
declare const Popup: any;
@Component({
  selector: 'app-vehicle-map',
  templateUrl: './vehicle-map.component.html',
  styleUrls: ['./vehicle-map.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class VehicleMapComponent extends TabComponent implements OnDestroy, AfterViewInit {
  @ViewChild('map') mapElement: ElementRef;
  readonly movingSymbol = Settings.movingSymbol;
  readonly standbySymbol = Settings.standbySymbol;

  vehicleData: any[];
  readonly shownVehicleData: any[] = [];

  private initialized = false;
  private active = false;

  private map: any;
  private markers = {};
  private popups = {};
  private markerCluster: any;

  @SessionStorage()
  private lastBounds;

  @SessionStorage('map.lastzoom', 8)
  private lastZoom;

  @SessionStorage('map.sharedzoom')
  private sharedZoom: number;

  private fittingBounds;
  showPopup = true;
  private defaultBounds;

  constructor(private vehicleService: VehicleService,
              private router: Router,
              private cdr: ChangeDetectorRef) {
    super();
  }

  private initMap(): void {
    this.map = new google.maps.Map(this.mapElement.nativeElement, {
      center: { lat: 47.49, lng: 19.04 },
      zoom: this.lastZoom || 8,
      mapTypeControl: false,
      zoomControl: false
    });
    setTimeout(() => this.defaultBounds = offsetBounds(this.map.getBounds()), 500);
    this.map.addListener('zoom_changed', () => {
      this.lastZoom = this.map.zoom;
      if (!this.fittingBounds) {
        this.lastBounds = offsetBounds(this.map.getBounds());
      } else {
        this.fittingBounds = false;
      }
      if (this.map.zoom > 15) {
        this.map.setMapTypeId('hybrid');
      } else {
        this.map.setMapTypeId('roadmap');
      }
    });
    this.map.addListener('dragend', () => {
      this.lastBounds = offsetBounds(this.map.getBounds());
    });
    this.map.addListener('bounds_changed', () => {
      this.shownVehicleData.length = 0;
      const bounds = this.map.getBounds();
      if (this.vehicleData) {
        this.vehicleData.forEach(data => {
          if (data.latLng && bounds.contains(data.latLng)) {
            this.shownVehicleData.push(data);
          }
        });
        this.cdr.markForCheck();
      }
    });
    this.markerCluster = new MarkerClusterer(this.map, this.markers,
      {
        maxZoom: 16,
        styles: [
          {
            url: 'radial-gradient(rgb(100, 136, 80) 45%, rgb(255, 255, 255) 45%, rgb(255, 255, 255) 50%, rgba(30, 30, 30, 0.3) 50%)',
            textColor: '#ffffff',
            height: 35,
            width: 35
          }
        ],
        averageCenter: true,
        gridSize: 40
      });
    longTouch(this.mapElement.nativeElement, () => this.map.fitBounds(this.defaultBounds));
    disableEvent(this.mapElement.nativeElement, 'swipeleft swiperight');
  }

  ngAfterViewInit() {
    super.ngAfterViewInit();
    if (this.mapElement.nativeElement) {
      this.initMap();
    }
    this.initialized = false;
    this.removableSubscriptions.push(
      this.vehicleService.getLatestVehicleDataFiltered().subscribe(result => {
        this.vehicleData = result || [];
        this.refreshMap();
        this.cdr.markForCheck();
        if (result === undefined) {
          this.lastZoom = this.lastBounds = null;
          this.initialized = false;
        }
      })
    );
  }

  ngOnDestroy(): void {
    super.ngOnDestroy();
    longTouch(this.mapElement.nativeElement, undefined, true);
  }

  refreshMap() {
    if (this.map) {
      this.markerCluster.clearMarkers();

      let maxX = -180, minX = 180, maxY = -90, minY = 90;
      this.vehicleData.forEach(data => {
        if (data.long && data.lat) {
          data.latLng = { lat: data.lat, lng: data.long };
          const latlng = new google.maps.LatLng(data.lat, data.long);
          maxX = Math.max(maxX, data.long);
          minX = Math.min(minX, data.long);
          maxY = Math.max(maxY, data.lat);
          minY = Math.min(minY, data.lat);
          let marker;
          if (!this.markers[data.vehicleId]) {
            marker = new google.maps.Marker({
              map: this.map,
              position: latlng,
              title: data.licensePlate,
              icon: data.ignition ? this.movingSymbol : this.standbySymbol
            });
            marker.addListener('click', () => this.markerClick(data.vehicleId));
            this.markers[data.vehicleId] = marker;
          } else {
            marker = this.markers[data.vehicleId];
            marker.setMap(this.map);
            marker.setPosition(latlng);
            marker.setIcon(data.ignition ? this.movingSymbol : this.standbySymbol);
          }
          this.markerCluster.addMarker(marker);
          if (this.popups[data.vehicleId]) {
            this.popups[data.vehicleId].setMap(null);
          }

          const element = document.createElement('div');
          const display = Settings.MAP_SHOWN_DETAILS
          .filter(key => data[key])
          .fillIfEmpty(['licensePlate'])
          .map(key => `<span>${data[key]}</span>`);

          element.innerHTML = `<div style="cursor: pointer; text-align: center;">${display.join('</br>')}</div>`;

          const popup = new Popup(latlng, element, marker, () => this.markerClick(data.vehicleId));
          if (this.showPopup) {
            popup.setMap(this.map);
          }
          this.popups[data.vehicleId] = popup;
        }
      });
      const filteredIds = this.vehicleData.map(data => data.vehicleId.toString());
      Object.keys(this.markers).forEach(key => {
        if (filteredIds.indexOf(key.toString()) < 0) {
          this.markers[key].setMap(null);
          this.popups[key].setMap(null);
        }
      });
      if (!this.initialized && Object.keys(this.markers).length) {
        this.lastBounds = this.lastBounds || { east: maxX, north: minY, west: minX, south: maxY };
        this.fittingBounds = true;
        this.defaultBounds = this.lastBounds;
        if (this.active) {
          this.map.fitBounds(this.lastBounds);
        }
      }
      this.initialized = true;
    }
  }

  markerClick(vehicleId: number): void {
    this.fittingBounds = true;
    this.sharedZoom = this.map.zoom;
    this.router.navigateByUrl(`/vehicle-view/${vehicleId}`);
  }

  togglePopups(): void {
    this.showPopup = !this.showPopup;
    this.vehicleData.forEach(data => {
      if (data.long && data.lat) {
        if (this.showPopup) {
          this.popups[data.vehicleId].setMap(this.map);
        } else {
          this.popups[data.vehicleId].setMap(null);
        }
      }
    });
  }

  switchEnd(): void {
    this.active = true;
    if (!this.map) {
      this.initMap();
      this.refreshMap();
    }
    this.fittingBounds = true;
    if (this.lastBounds) {
      this.map.fitBounds(this.lastBounds);
    }
  }

  switchOut(): void {
    this.active = false;
  }
}
