import { Injectable, EventEmitter } from '@angular/core';
import { LoadingProgressService } from './../widget/loading-indicator/loading-progress.service';
import { Observable, ReplaySubject } from 'rxjs';
import { Settings } from '../settings/settings';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { first } from 'rxjs/operators';
import version from 'src/assets/version.json';
import { Market } from '@ionic-native/market/ngx';
import { Platform } from '@ionic/angular';

@Injectable()
export class AuthHttpClient {

  public static cache: Map<string, CachedUrl> = new Map();
  public readonly error = new EventEmitter<HttpErrorResponse>();

  public static initCache(url, lastUpdated?) {
    if (AuthHttpClient.cache.get(url)) {
      AuthHttpClient.cache.get(url).dataSubject.complete();
    }
    const dataSubject = new ReplaySubject<any>(1);
    AuthHttpClient.cache.set(url, {
      lastUpdated: lastUpdated || Date.now(),
      url: url,
      observable: dataSubject.asObservable().pipe(first()),
      dataSubject: dataSubject
    });
  }

  public static invalidateCacheByPath(path: string) {
    AuthHttpClient.cache.forEach(cachedUrl => {
      if (cachedUrl.url && cachedUrl.url.startsWith(path)) {
        console.log(`invalidating ${cachedUrl.url}`);
        AuthHttpClient.initCache(cachedUrl.url, 1);
      }
    });
  }

  constructor(private http: HttpClient, public readonly loadingProgressService: LoadingProgressService,
    private market: Market, private platform: Platform) {}

  get(url: string, options?: any, cacheInterval?: number, silent?: boolean): Observable<any> {
    if (url == null || url.includes('null') || url.includes('undefined')) {
      return new Observable();
    }
    if (!AuthHttpClient.cache.has(url)
      || AuthHttpClient.cache.get(url).lastUpdated + (cacheInterval || Settings.CACHE_INTERVAL) < Date.now()) {
      const obs = this.attachProgress(url, this.http.get(url, options), silent);
      AuthHttpClient.initCache(url);
      obs.subscribe(
        response => AuthHttpClient.cache.get(url).dataSubject.next(response),
        err => {
          AuthHttpClient.cache.get(url).dataSubject.error(err);
          this.invalidateCache(url);
        }
      );
    }
    return AuthHttpClient.cache.get(url).observable;
  }

  post(url: string, body: any, dirtyMap?, options?: any, silent?: boolean): Observable<any> {
    AuthHttpClient.invalidateCacheByPath(url);
    const b = this.cleanObject(body, dirtyMap);
    const obs = this.attachProgress(url, this.http.post(url, b, options), silent);
    return obs;
  }

  put(url: string, body: any, dirtyMap?, options?: any): Observable<any> {
    AuthHttpClient.invalidateCacheByPath(url);
    const b = this.cleanObject(body, dirtyMap);
    const obs = this.http.put(url, b, options);
    return this.attachProgress(url, obs);
  }

  delete(url: string, options?: any): Observable<any> {
    AuthHttpClient.invalidateCacheByPath(url);
    const obs = this.http.delete(url, options);
    return this.attachProgress(url, obs);
  }

  patch(url: string, body: any, dirtyMap?): Observable<any> {
    AuthHttpClient.invalidateCacheByPath(url);
    const b = this.cleanObject(body, dirtyMap);
    const obs = this.http.patch(url, b);
    return this.attachProgress(url, obs);
  }

  request(url: string, body: any, options?: any, silent?: boolean): Observable<any> {
    AuthHttpClient.invalidateCacheByPath(url);
    const obs = silent ?
      this.http.post(url, body, options).pipe(first()) :
      this.attachProgress(url, this.http.post(url, body, options));
    return obs;
  }

  head(url: string, options?: any): Observable<any> {
    const obs = this.http.head(url, options);
    return this.attachProgress(url, obs);
  }

  options(url: string, options?: any): Observable<any> {
    const obs = this.http.options(url, options);
    return this.attachProgress(url, obs);
  }

  attachProgress(id: string, obs: Observable<any>, disableProgressbar?: boolean): Observable<any> {
    if (!disableProgressbar) {
      this.loadingProgressService.start(id);
    }
    return new Observable<any>((observer) => {
      obs.pipe(first()).subscribe(
          result => {
            const message = result ? result.message : null;
            this.loadingProgressService.complete(id, null, message);
            observer.next(result);
            observer.complete();
          },
          err => {
            if (err) {
              if (err.status === 401) {
                this.loadingProgressService.complete(id, null, null);
              } else if (err.status === 403 && err.headers.get('X-MINIMUM-CLIENT-VERSION')) {
                this.loadingProgressService.error(id, 'MINIMUM_CLIENT_VERSION', () => {
                  if (this.platform.is('android')) {
                    this.market.open(version.package);
                  } else if (this.platform.is('ios')) {
                    this.market.open(version.appleAppId);
                  }
                  if (navigator['app']) {
                    navigator['app'].exitApp();
                  }
                });
              } else if (err.error && err.error.message) {
                this.loadingProgressService.error(id, err.error.message);
              } else if (err.status === 0) {
                this.loadingProgressService.error(id, 'SERVICE_NOT_AVAILABLE');
              } else {
                this.loadingProgressService.error(id);
              }
              this.error.emit(err);
            }
            observer.error(err);
            observer.complete();
          }
        );
    });
  }

  public invalidateCache(url: string) {
    AuthHttpClient.initCache(url, 1);
  }

  protected cleanObject(object: Object, dirtyMap?: Object): any {
    if (dirtyMap === 'donttouchthis') {
      return object;
    }
    if (object && object['request']) {
      object['request'] = this.deepCleanObject(object['request'], dirtyMap);
      if (object['request'] == null) {
        object['request'] = {};
      }
      return object;
    } else {
      return this.deepCleanObject(object, dirtyMap);
    }
  }

  private deepCleanObject(object: Object, dirtyMap?: Object, parentObjectTrue?: boolean): any {
    if (object && typeof object !== 'object') {
      return object;
    }

    const newObj = {};

    for (const key in object) {
      if (object[key] !== undefined && object[key] !== null && key.indexOf('$') <= -1
        && (
          dirtyMap && dirtyMap[key]
          || parentObjectTrue
          || key !== 'syntheticProperties' && !dirtyMap
            && (typeof object['syntheticProperties'] !== 'string' || !object['syntheticProperties'].includes(key))
          )
        ) {
          const objectTrue = dirtyMap && dirtyMap[key] === true;
        if (object[key] instanceof Date) {
          newObj[key] = object[key].getTime();
        } else if (Array.isArray(object[key])) {
          newObj[key] = [];
          object[key].forEach(o => {
            const tempObj = this.deepCleanObject(o, dirtyMap ? dirtyMap[key] : null, objectTrue);
            if (tempObj != null) {
              newObj[key].push(tempObj);
            }
          });
        } else if (typeof object[key] === 'object') {
            newObj[key] = this.deepCleanObject(object[key], dirtyMap ? dirtyMap[key] : null, objectTrue);
            if (newObj[key] == null) {
              delete newObj[key];
            }
        } else {
          newObj[key] = object[key];
        }
      }
    }

    return Object.keys(newObj).length === 0 ? null : newObj;
  }
}

export class CachedUrl {
  public lastUpdated: number;
  public url: string;
  public observable: Observable<any>;
  public dataSubject: ReplaySubject<any>;

  public constructor() {}
}
