import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'vehicleFilter',
  pure: false
})
export class VehicleFilterPipe implements PipeTransform {

  transform(values: any[], filters?: any): any[] {
    if (values && filters) {
      return values.filter(value =>
        (!filters.licensePlate || !filters.licensePlate.length || filters.licensePlate.indexOf(value.vehicleId) > -1)
        && (!filters.driverName || !filters.driverName.length || filters.driverName.indexOf(value.driverId) > -1)
        && (!filters.group || !filters.group.length || filters.group.flatten().map(o => o.objectId).indexOf(value.vehicleId) > -1 )
      );
    }
    return values;
  }

}
