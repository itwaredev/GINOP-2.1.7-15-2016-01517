import { MatTabGroup } from '@angular/material';
import { Input, AfterViewInit, OnDestroy } from '@angular/core';
import { Unsubscribe } from './util/unsubscribe';
import { Subscription } from 'rxjs';

@Unsubscribe()
export abstract class TabComponent implements AfterViewInit, OnDestroy {
    private _tabContainerGroup: MatTabGroup;
    private _tabIndex: number;
    @Input() private set tabContainerGroup(group: MatTabGroup) {
        this._tabContainerGroup = group;
    }
    @Input() private set tabIndex(index: number) {
        this._tabIndex = index;
    }

    protected readonly removableSubscriptions: Subscription[] = [];

    ngAfterViewInit(): void {
        if (!this._tabContainerGroup) {
            console.warn('tabContainerGroup of TabComponent has not been specified, this instance won\'t be notified about tab switches');
            return;
        }
        this.removableSubscriptions.push(
            this._tabContainerGroup.selectedIndexChange.subscribe((index: number) => {
                if (index === this._tabIndex) {
                    this.switch();
                } else {
                    this.switchOut();
                }
            })
        );
        this.removableSubscriptions.push(
            this._tabContainerGroup.animationDone.subscribe(() => {
                if (this._tabContainerGroup.selectedIndex === this._tabIndex) {
                    this.switchEnd();
                }
            })
        );
    }

    ngOnDestroy(): void {}

    /** empty implementation eliminates the neccessity to implement both handlers */
    protected switch(): void {}
    protected switchEnd(): void {}
    protected switchOut(): void {}
}

export abstract class VehicleTabComponent extends TabComponent {
    public abstract setVehicleData(vehicleData: any, update?: boolean): void;
}
