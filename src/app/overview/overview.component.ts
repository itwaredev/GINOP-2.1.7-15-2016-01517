import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute, Params } from '@angular/router';
import { Subscription } from 'rxjs';
import { LocalStorage } from 'ngx-webstorage';

@Component({
  selector: 'app-overview',
  templateUrl: './overview.component.html',
  styleUrls: ['./overview.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class OverViewComponent implements OnInit, OnDestroy {
  private routeSubscription: Subscription;

  @LocalStorage()
  selectedTab: number;

  constructor(private activatedRoute: ActivatedRoute, public readonly cdr: ChangeDetectorRef) { }

  ngOnInit() {
    this.routeSubscription = this.activatedRoute.params.subscribe((params: Params) => {
      this.selectedTab = params['tab'] || this.selectedTab || 0;
    });
  }

  ngOnDestroy(): void {
    this.routeSubscription.unsubscribe();
  }
}
