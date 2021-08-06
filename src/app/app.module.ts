import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { RouteReuseStrategy } from '@angular/router';
import { IonicModule, IonicRouteStrategy } from '@ionic/angular';
import { AppComponent } from './app.component';
import { AuthComponent } from './auth/auth.component';
import { WidgetModule } from './widget/widget.module';
import { MaterialUiModule } from './widget/material-ui/material-ui.module';
import { TranslateModule, TranslateLoader } from '@ngx-translate/core';
import { AuthService } from './auth/auth.service';
import { AuthHttpClient } from './util/http';
import { LoadingProgressService } from './widget/loading-indicator/loading-progress.service';
import { HttpClientModule, HttpClient, HTTP_INTERCEPTORS } from '@angular/common/http';
import { AppRoutingModule } from './app-routing.module';
import { NoopAnimationsModule, BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { DatePipe } from '@angular/common';
import { OverViewComponent } from './overview/overview.component';
import { VehicleListComponent } from './overview/vehicle-list/vehicle-list.component';
import { VehicleService } from './service/vehicle.service';
import { JwtAuthInterceptor } from './auth/jwt-auth-interceptor';
import { VehicleFilterComponent } from './overview/vehicle-filter/vehicle-filter.component';
import { VehicleFilterPipe } from './overview/vehicle-filter/vehicle-filter.pipe';
import { VehicleStatusComponent } from './vehicle-view/vehicle-status/vehicle-status.component';
import { VehicleViewComponent } from './vehicle-view/vehicle-view.component';
import { HistoryService } from './service/history.service';
import { VehicleRouteComponent } from './vehicle-view/vehicle-route/vehicle-route.component';
import { VehicleMapComponent } from './overview/vehicle-map/vehicle-map.component';
import { AlertService } from './service/alert.service';
import { AlertFilterPipe } from './overview/vehicle-filter/alert-filter.pipe';
import { VehicleAlertsComponent } from './overview/vehicle-alerts/vehicle-alerts.component';
import { NgxWebstorageModule } from 'ngx-webstorage';
import { SettingsComponent } from './settings/settings.component';
import { ImpressumComponent } from './impressum/impressum.component';
import { AppAuthInterceptor } from './auth/app-auth-interceptor';
import { Firebase } from '@ionic-native/firebase/ngx';
import { Toast } from '@ionic-native/toast/ngx';
import { StatisticComponent } from './statistic/statistic.component';
import { DriversStatComponent } from './statistic/drivers-stat/drivers-stat.component';
import { StatisticService } from './service/statistic.service';
import { VehicleReportsComponent } from './vehicle-view/vehicle-reports/vehicle-reports.component';
import { ToastrModule } from 'ngx-toastr';
import { ToasterService } from './service/toaster.service';
import { Crashlytics } from '@ionic-native/fabric/ngx';
import { ClientVersionInterceptor } from './auth/client-version-interceptor';
import { Market } from '@ionic-native/market/ngx';
import { AlertComponent } from './alert/alert.component';
import { AlertSetupComponent } from './alert/alert-setup/alert-setup.component';
import { ReminderSetupComponent } from './alert/reminder-setup/reminder-setup.component';
import { ContactComponent } from './alert/contact/contact.component';
import { ModemReportComponent } from './modem-report/modem-report.component';


export function createTranslateLoader(http: HttpClient) {
  return new TranslateHttpLoader(http, './assets/i18n/', '.json');
}

@NgModule({
  declarations: [
    AppComponent,
    AuthComponent,
    OverViewComponent,
    VehicleListComponent,
    VehicleFilterComponent,
    VehicleStatusComponent,
    VehicleViewComponent,
    VehicleFilterPipe,
    VehicleRouteComponent,
    VehicleMapComponent,
    VehicleAlertsComponent,
    AlertFilterPipe,
    SettingsComponent,
    ImpressumComponent,
    StatisticComponent,
    VehicleReportsComponent,
    DriversStatComponent,
    AlertComponent,
    AlertSetupComponent,
    ReminderSetupComponent,
    ContactComponent,
    ModemReportComponent
  ],
  imports: [
    BrowserModule,
    IonicModule.forRoot(),
    WidgetModule,
    MaterialUiModule,
    NgxWebstorageModule.forRoot(),
    TranslateModule.forRoot({
      loader: {
        provide: TranslateLoader,
        useFactory: (createTranslateLoader),
        deps: [HttpClient],
      }
    }),
    HttpClientModule,
    AppRoutingModule,
    NoopAnimationsModule,
    BrowserAnimationsModule,
    ToastrModule.forRoot()
  ],
  exports: [
    TranslateModule
  ],
  providers: [
    {
      provide: HTTP_INTERCEPTORS,
      useClass: JwtAuthInterceptor,
      multi: true
    },
    {
      provide: HTTP_INTERCEPTORS,
      useClass: AppAuthInterceptor,
      multi: true
    },
    {
      provide: HTTP_INTERCEPTORS,
      useClass: ClientVersionInterceptor,
      multi: true
    },
    DatePipe,
    AuthService,
    LoadingProgressService,
    VehicleService,
    HistoryService,
    AuthHttpClient,
    VehicleFilterPipe,
    AlertFilterPipe,
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
    AlertService,
    Firebase,
    Toast,
    StatisticService,
    ToasterService,
    Crashlytics,
    Market
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
