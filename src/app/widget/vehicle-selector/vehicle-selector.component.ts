import { Component, OnInit, ElementRef, EventEmitter, Output, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { VehicleService } from 'src/app/service/vehicle.service';
import { StringNumberComparator } from 'src/app/util/comparators';
import { Subscription } from 'rxjs';
import { Unsubscribe } from 'src/app/util/unsubscribe';

declare const Hammer: any, propagating: any;

@Component({
  selector: 'app-vehicle-selector',
  templateUrl: './vehicle-selector.component.html',
  styleUrls: ['./vehicle-selector.component.scss']
})
@Unsubscribe()
export class VehicleSelectorComponent implements OnInit, OnDestroy {

  vehicleData: any[];
  selectedVehicleId: number;
  private comparator = new StringNumberComparator();
  @Output() vehicleIdChange: EventEmitter<any> = new EventEmitter();

  private vehicleSubscription: Subscription;

  constructor(private vehicleService: VehicleService,
              private cdr: ChangeDetectorRef,
              private host: ElementRef<any>) {}

  ngOnInit() {
    this.vehicleSubscription = this.vehicleService.getVehicles().subscribe(res => {
      if (res) {
        this.vehicleData = (res || []).sort((a, b) => this.comparator.compare(a, b, 'licensePlate', null, null, null, true));
        const id = this.selectedVehicleId || this.vehicleData[0].id;
        this.selectedVehicleId = null;
        if (this.vehicleData && this.vehicleData.length > 0) {
          this.selectVehicle(id);
        }
      }
    });
    const hammer = propagating(new Hammer(this.host.nativeElement));
    const stop = (event: any) => event.stopPropagation();
    hammer.on('swipeleft', stop);
    hammer.on('swiperight', stop);
  }

  ngOnDestroy() {
    this.vehicleSubscription = null;
  }

  selectVehicle(vehicleId: number, placeOnly = false): void {
    if (vehicleId) {
      this.selectedVehicleId = vehicleId;
      this.cdr.markForCheck();
      if (!placeOnly) {
        this.vehicleIdChange.emit(this.selectedVehicleId);
      }
      if (this.vehicleData) {
        const selectedIndex = this.vehicleData.findIndex(item => item.id === this.selectedVehicleId);
        setTimeout(() => {
          const children = this.host.nativeElement.children;
          let place = 0, lastWidth = 0;
          for (let i = 0; i < selectedIndex && i < children.length; i++) {
            place += lastWidth = children[i].clientWidth + children[i].offsetWidth;
          }
          if (this.host.nativeElement.scrollLeft + this.host.nativeElement.clientWidth < place + lastWidth
            || this.host.nativeElement.scrollLeft > selectedIndex * lastWidth) {
            this.host.nativeElement.scrollLeft =
              Math.min(place, this.host.nativeElement.scrollWidth - this.host.nativeElement.clientWidth);
          }
        }, 0);
      }
    }
  }

}
