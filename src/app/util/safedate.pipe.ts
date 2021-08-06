import { Pipe, PipeTransform } from '@angular/core';
import { DateAdapter } from '@angular/material';

@Pipe({
  name: 'safedate'
})
export class SafedatePipe implements PipeTransform {
  private readonly dateFields = ['weekday', 'year', 'month', 'day'];

  constructor(private dateAdapter?: DateAdapter<any>) {}

  transform(value: string | number | Date, format?: any): string {
    if (!value) {
      return null;
    }
    if (typeof value === 'string' || typeof value === 'number') {
      value = new Date(value);
    }
    switch (format || 'datetime') {
      case 'datetime':
        format = {year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit'};
        break;
      case 'date':
        format = {year: 'numeric', month: '2-digit', day: '2-digit'};
        break;
      case 'time':
        format = {hour: '2-digit', minute: '2-digit'};
        break;
    }
    format.hour12 = false;
    try {
      if (Object.keys(format).find(item => this.dateFields.includes(item))) {
        return value.toLocaleDateString(this.dateAdapter['locale'] || [], format);
      } else {
        return value.toLocaleTimeString(this.dateAdapter['locale'] || [], format);
      }
    } catch (e) {
      console.warn(e.message);
      return value.toLocaleDateString();
    }
  }

}
