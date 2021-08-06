import { Injectable } from '@angular/core';
import { HttpRequest, HttpHandler, HttpInterceptor, HttpEvent } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable()
export class AppAuthInterceptor implements HttpInterceptor {
  constructor() {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    if (environment.appAuthKey) {
      const cloned = req.clone({ headers: req.headers.set('X-AUTH', environment.appAuthKey) });
      return next.handle(cloned);
    } else {
      return next.handle(req);
    }
  }
}
