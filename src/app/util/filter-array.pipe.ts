import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'filterArray',
  pure: false
})
export class FilterArrayPipe implements PipeTransform {

  transform(values: any[], config?: FilterArrayConfig): any[] {
    const result = [];
    if (values) {
      values.map(value => {
        if (config.contained && config.contained.indexOf(value[config.propName]) !== -1
          || config.filtered && config.filtered.indexOf(value[config.propName]) === -1) {
          result.push(value);
        }
      });
    }
    return result;
  }

}

export class FilterArrayConfig {
  public propName: string;
  public filtered: Array<any> = [];
  public contained: Array<any> = [];
}
