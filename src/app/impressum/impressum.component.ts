import { Component, OnInit } from '@angular/core';
import { VersionService } from '../version/version.service';
import { VersionColor, ImpressumInfo } from '../version/version';
import { first } from 'rxjs/operators';
import { environment } from 'src/environments/environment';
import { LocalStorage } from 'ngx-webstorage';
import { Settings } from '../settings/settings';
import { hash } from '../util/utils';

@Component({
  selector: 'app-impressum',
  templateUrl: './impressum.component.html',
  styleUrls: ['./impressum.component.scss']
})
export class ImpressumComponent implements OnInit {

  @LocalStorage('impressum.info', new ImpressumInfo())
  impressumInfo;

  metadata = {
    name: 'impressum',
    readonly: true,
    groups: [{
      title: 'owner',
      fields: [
        {
          name: 'address',
          type: 'textarea'
        },
        {
          name: 'phone',
          type: 'text'
        },
        {
          name: 'website',
          type: 'text'
        },
        {
          name: 'email',
          type: 'text'
        }
      ]
    }]
  };

  public readonly APP_NAME = environment.APP_NAME;
  public readonly printAllVersion = environment.version;

  private _versionColor = this.getVersionColor();
  public get versionColor(): VersionColor {
    return this._versionColor;
  }

  constructor(public readonly versionService: VersionService) { }

  ngOnInit() {
    this._versionColor = this.getVersionColor();
    if (this.impressumInfo.time < new Date().getTime() - Settings.IMPRESSUM_CACHE_INTERVAL) {
      this.versionService.getImpressum().pipe(first()).subscribe(impressumInfo => {
        this.impressumInfo = impressumInfo || this.impressumInfo;
        if (this.impressumInfo.address) {
          this.impressumInfo.address = this.impressumInfo.address.replace(/\\n/g, '\n');
        }
      });
    } else if (this.impressumInfo.address) {
      this.impressumInfo.address = this.impressumInfo.address.replace(/\\n/g, '\n');
    }
  }

  private getVersionColor(): VersionColor {
    if (this.versionService.versionInfo === undefined) {
      return new VersionColor();
    }
    const appVersionColor = '000000' + hash(this.versionService.versionInfo.appVersion);
    return new VersionColor(
      this.versionService.versionInfo.scmInfo ? `#${this.versionService.versionInfo.scmInfo
        .substring(this.versionService.versionInfo.scmInfo.length - 6, this.versionService.versionInfo.scmInfo.length)}` :
        null,
      `#${this.versionService.versionInfo.frontendVersion.substring(0, 6)}`,
      `#${(appVersionColor).substring(appVersionColor.length - 6, appVersionColor.length)}`
    );
  }
}
