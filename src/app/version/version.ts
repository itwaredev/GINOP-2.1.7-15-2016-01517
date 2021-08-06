import { Settings } from '../settings/settings';

export class VersionInfo {
    public version?: string;
    public buildTime?: string;
    public scmInfo?: string;
    public frontendVersion: string;
    public frontendDate: string;
    public appVersion: string;
    public package: string;
    public appleAppId: string;
}

export class VersionColor {
    public readonly frontend: string;
    public readonly backend: string;
    public readonly app: string;

    private readonly defaultColor = '#ffffff';

    constructor(backendColor?: string, frontendColor?: string, appColor?: string) {
        this.backend = backendColor || this.defaultColor;
        this.frontend = frontendColor || this.defaultColor;
        this.app = appColor || this.defaultColor;
    }
}

export class ImpressumInfo {
    public address: string;
    public phone: string;
    public website: string;
    public email: string;

    public readonly time: number;

    constructor(obj?: ImpressumInfo) {
        if (obj) {
            Object.keys(obj).forEach(key => this[key] = obj[key]);
            this.time = new Date().getTime();
        } else {
            this.time = new Date().getTime() - Settings.IMPRESSUM_CACHE_INTERVAL;
        }
    }
}
