import { MaterialUiModule } from './../material-ui/material-ui.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { FormForModelComponent } from './form-for-model.component';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AutocompleteComponent } from './autocomplete/autocomplete.component';
import { MatAutocompleteModule } from '@angular/material';
import { TranslateModule } from '@ngx-translate/core';
import { UtilModule } from '../../util/util.module';
import { IonicModule } from '@ionic/angular';
import { MultilineComponent } from './multiline/multiline.component';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';

@NgModule({
  imports: [
    FormsModule,
    ReactiveFormsModule,
    CommonModule,
    MaterialUiModule,
    MatAutocompleteModule,
    TranslateModule,
    UtilModule,
    FontAwesomeModule,
    IonicModule.forRoot()
  ],
  declarations: [
    FormForModelComponent,
    AutocompleteComponent,
    MultilineComponent
  ],
  exports: [
    FormForModelComponent
  ]
})
export class FormForModelModule { }
