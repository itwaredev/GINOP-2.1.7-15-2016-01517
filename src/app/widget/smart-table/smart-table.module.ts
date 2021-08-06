import { TranslateModule } from '@ngx-translate/core';
import { MaterialUiModule } from './../material-ui/material-ui.module';
import { SmartTableComponent } from './smart-table.component';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule, MatPaginatorModule, MatSortModule } from '@angular/material';

@NgModule({
  imports: [
    CommonModule,
    MatTableModule,
    MaterialUiModule,
    MatPaginatorModule,
    TranslateModule,
    MatSortModule
  ],
  declarations: [
    SmartTableComponent
  ],
  exports: [
    SmartTableComponent
  ]
})
export class SmartTableModule { }
