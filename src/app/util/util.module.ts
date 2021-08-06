import { ToArrayPipe } from './to-array.pipe';
import { SortByPipe } from './sort-by.pipe';
import { KeysPipe } from './keys.pipe';
import { ImagePipe } from './image.pipe';
import { FilterArrayPipe } from './filter-array.pipe';
import { NgModule } from '@angular/core';
import { SafePipe } from './safe.pipe';
import { SafedatePipe } from './safedate.pipe';

@NgModule({
  imports: [
  ],
  declarations: [
    FilterArrayPipe,
    ImagePipe,
    KeysPipe,
    SortByPipe,
    ToArrayPipe,
    SafePipe,
    SafedatePipe
  ],
  exports: [
    FilterArrayPipe,
    ImagePipe,
    KeysPipe,
    SortByPipe,
    ToArrayPipe,
    SafePipe,
    SafedatePipe
  ],
  providers: [
    SafePipe,
    SafedatePipe,
    SortByPipe,
    FilterArrayPipe
  ]
})
export class UtilModule { }
