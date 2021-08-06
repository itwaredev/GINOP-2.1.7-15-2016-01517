import { RouterModule, Routes } from '@angular/router';
import { NgModule } from '@angular/core';
import { AuthenticationGuard } from './auth/authentication.guard';
import { AuthComponent } from './auth/auth.component';
import { OverViewComponent } from './overview/overview.component';
import { VehicleViewComponent } from './vehicle-view/vehicle-view.component';
import { SettingsComponent } from './settings/settings.component';
import { ImpressumComponent } from './impressum/impressum.component';
import { StatisticComponent } from './statistic/statistic.component';
import { AlertComponent } from './alert/alert.component';
import { VehicleAlertsComponent } from './overview/vehicle-alerts/vehicle-alerts.component';
import { ModemReportComponent } from './modem-report/modem-report.component';

export const APP_ROUTES: Routes = [
  {
    path: '',
    redirectTo: '/overview',
    pathMatch: 'full',
    canActivate: [AuthenticationGuard]
  },
  {
    path: 'login',
    component: AuthComponent,
    canActivate: [AuthenticationGuard],
    data: { title: 'MENU.LOGIN' }
  },
  {
    path: 'settings',
    component: SettingsComponent,
    canActivate: [AuthenticationGuard],
    data: { title: 'MENU.SETTINGS' }
  },
  {
    path: 'statistic',
    component: StatisticComponent,
    canActivate: [AuthenticationGuard],
    data: { title: 'MENU.STATISTIC' }
  },
  {
    path: 'alert',
    component: AlertComponent,
    canActivate: [AuthenticationGuard],
    data: { title: 'MENU.ALERT' }
  },
  {
    path: 'impressum',
    component: ImpressumComponent,
    canActivate: [AuthenticationGuard],
    data: { title: 'MENU.IMPRESSUM' }
  },
  {
    path: 'overview',
    component: OverViewComponent,
    canActivate: [AuthenticationGuard],
    data: { title: 'MENU.OVERVIEW' }
  },
  {
    path: 'overview/:tab',
    component: OverViewComponent,
    canActivate: [AuthenticationGuard],
    data: { title: 'MENU.OVERVIEW' }
  },
  {
    path: 'vehicle-view/:vehicleId',
    component: VehicleViewComponent,
    canActivate: [AuthenticationGuard],
    data: { title: 'MENU.VEHICLEVIEW', level: 1 }
  },
  {
    path: 'vehicle-view/:vehicleId/:tab',
    component: VehicleViewComponent,
    canActivate: [AuthenticationGuard],
    data: { title: 'MENU.VEHICLEVIEW', level: 1 }
  },
  {
    path: 'int/stat/alert-list/:token',
    component: VehicleAlertsComponent,
    canActivate: [AuthenticationGuard],
    data: { title: 'MENU.ALERT' }
  },
  {
    path: 'int/stat/alert-setup/:token',
    component: AlertComponent,
    canActivate: [AuthenticationGuard],
    data: { title: 'MENU.ALERT' }
  },
  {
    path: 'int/stat/:token',
    component: StatisticComponent,
    canActivate: [AuthenticationGuard],
    data: { title: 'MENU.STATISTIC' }
  },
  {
    path: 'int/exp-stat/:token',
    component: ModemReportComponent,
    canActivate: [AuthenticationGuard],
    data: { title: 'Modem report' }
  }
];

@NgModule({
  imports: [
    RouterModule.forRoot(APP_ROUTES, {useHash: false})
  ],
  exports: [
    RouterModule
  ],
  providers: [
    AuthenticationGuard
  ]
})
export class AppRoutingModule { }
