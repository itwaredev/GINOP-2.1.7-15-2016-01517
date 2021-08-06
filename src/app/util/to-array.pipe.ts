import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'toArray'
})
export class ToArrayPipe implements PipeTransform {

  transform(value: any, args?: any): any {
    let result = [];
    if (!value) {
      return result;
    }
    Object.keys(value).map(key => result.push(value[key]));
    return result;
  }

}
