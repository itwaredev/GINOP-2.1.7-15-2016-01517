import { Pipe, PipeTransform } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { StringNumberComparator } from './comparators';

@Pipe({name: 'sortBy'})
export class SortByPipe implements PipeTransform {

  stringNumberComparator = new StringNumberComparator();

  constructor(private translate: TranslateService) {
  }

  /**
   * @brief This pipe orders the elements in the array using TranslateService and LocalizePipe on demand.
   * @param [in] Array<string> array The array, which needs to be sorted.
   * @param [in] string prefix The prefix will be appended before every item in the array.
   * Used to find the correct translation for the items.
   * @param [in] string field If the item in the array is complex, you may access it's 'field'.
   * @param [in] boolean translate When true the item will be searched from tranlation files.
   * When false the array will be sorted based on the item's localization field.
   * To skip tranlation and localization the value should be undefined.
   * @return The sorted array.
   */
  transform(array: Array<any>, prefix?: string, field?: string, translate?: boolean, direction?: string): Array<any> {
    if (!array || array.length < 2) {
      return array;
    }
    array.sort((a: any, b: any) => {
      if (field) {
        a = a[field];
        b = b[field];
      }

      if (prefix) {
        a = prefix.toUpperCase() + a;
        b = prefix.toUpperCase() + b;
      }

      if (translate) {
        a = this.translate.instant(a.toUpperCase());
        b = this.translate.instant(b.toUpperCase());
      }

      return this.stringNumberComparator.compare(a + '', b + '', null, direction, true, true, true);
    });
    return array;
  }
}
