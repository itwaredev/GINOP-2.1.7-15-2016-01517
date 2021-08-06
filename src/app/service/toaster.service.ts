import { Injectable } from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import { Settings } from '../settings/settings';

@Injectable()
export class ToasterService {

    private readonly options = {
        progressBar: true,
        timeOut: Settings.TOASTER_TIMEOUT,
        preventDuplicates: true,
        positionClass: 'toaster-pos'
    };

    constructor(private toaster: ToastrService) {}

    success(message: string) {
        this.toaster.success(message, '', this.options);
    }

    info(message: string) {
        this.toaster.info(message, '', this.options);
    }

    warning(message: string) {
        this.toaster.warning(message, '', this.options);
    }

    error(message: string) {
        this.toaster.error(message, '', this.options);
    }

}
