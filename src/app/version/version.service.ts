import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { VersionInfo, ImpressumInfo } from './version';
import { first, map } from 'rxjs/operators';
import { Settings } from '../settings/settings';
import { AuthHttpClient } from '../util/http';
import { environment } from 'src/environments/environment';
import version from 'src/assets/version.json';

@Injectable({
  providedIn: 'root'
})
export class VersionService {

  private _versionInfo: VersionInfo;
  public get versionInfo(): VersionInfo {
    return this._versionInfo;
  }

  constructor(private http: AuthHttpClient) {
    this._versionInfo = version as VersionInfo;
    if (environment.version) {
      this.http.get(Settings.VERSION_URL, undefined, undefined, true)
        .pipe(first()).subscribe(res => this._versionInfo = {...this._versionInfo, ...res.response} as VersionInfo);
    }
  }

  getImpressum(): Observable<ImpressumInfo> {
    return this.http.get(Settings.IMPRESSUM_URL, undefined, Settings.IMPRESSUM_CACHE_INTERVAL, true)
      .pipe(first(), map(result => new ImpressumInfo(result.response)));
  }
}
