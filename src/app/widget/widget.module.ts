import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MaterialUiModule } from './material-ui/material-ui.module';
import { UtilModule } from '../util/util.module';
import { FormForModelModule } from './form-for-model/form-for-model.module';
import { LoadingIndicatorComponent } from './loading-indicator/loading-indicator.component';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { library } from '@fortawesome/fontawesome-svg-core';
import { fas, IconPack } from '@fortawesome/free-solid-svg-icons';
import { far } from '@fortawesome/free-regular-svg-icons';
import { fab } from '@fortawesome/free-brands-svg-icons';
import { TranslateModule } from '@ngx-translate/core';
import { TemplateListComponent } from './template-list/template-list.component';
import { IntervalSelectComponent } from './interval-select/interval-select.component';
import { VehicleSelectorComponent } from './vehicle-selector/vehicle-selector.component';
import { ReportChartComponent } from './report-chart/report-chart.component';
import { ProgressbarSetComponent } from './progressbar-set/progressbar-set.component';
import { SmartTableModule } from './smart-table/smart-table.module';
import { ConfirmDialogComponent } from './confirm.dialog';
import { PageScrollTableComponent } from './page-scroll-table/page-scroll-table.component';
import { ScrollingModule } from '@angular/cdk/scrolling';

library.add(fas, far, fab as IconPack);

@NgModule({
  imports: [
    CommonModule,
    MaterialUiModule,
    FormForModelModule,
    TranslateModule,
    FontAwesomeModule,
    SmartTableModule,
    UtilModule,
    ScrollingModule
  ],
  declarations: [
    LoadingIndicatorComponent,
    TemplateListComponent,
    IntervalSelectComponent,
    VehicleSelectorComponent,
    ReportChartComponent,
    ProgressbarSetComponent,
    ConfirmDialogComponent,
    PageScrollTableComponent
  ],
  exports: [
    FormForModelModule,
    LoadingIndicatorComponent,
    FontAwesomeModule,
    TemplateListComponent,
    IntervalSelectComponent,
    VehicleSelectorComponent,
    ReportChartComponent,
    ProgressbarSetComponent,
    SmartTableModule,
    UtilModule,
    ConfirmDialogComponent,
    PageScrollTableComponent
  ],
  entryComponents: [
    ConfirmDialogComponent
  ]
})
export class WidgetModule { }
