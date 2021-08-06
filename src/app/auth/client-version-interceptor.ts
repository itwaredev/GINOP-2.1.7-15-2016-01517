import { Injectable } from '@angular/core';
import { HttpRequest, HttpHandler, HttpInterceptor, HttpEvent } from '@angular/common/http';
import { Observable } from 'rxjs';
import version from 'src/assets/version.json';

@Injectable()
export class ClientVersionInterceptor implements HttpInterceptor {
  constructor() {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    if (version) {
      const cloned = req.clone({ headers: req.headers.set('X-CLIENT-VERSION', version.appVersion) });
      return next.handle(cloned);
    } else {
      return next.handle(req);
    }
  }
}
