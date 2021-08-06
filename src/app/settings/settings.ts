import { environment } from 'src/environments/environment';
import { LocalStorage } from 'ngx-webstorage';

export interface SidenavItem {
    icon: string;
    name: string;
    url: string;
    class: string;
}

export class Settings {
    static LONG_TOUCH_DURATION = 1000;
    static CACHE_INTERVAL = 30000;
    static IMPRESSUM_CACHE_INTERVAL = 86400000;
    static TOASTER_TIMEOUT = 3000;
    static readonly DEFAULT_MAP_SHOWN_DETAILS = ['name', 'licensePlate', 'driverName'];
    static readonly GEOFENCING_ALERT_ICON = 'sign-out-alt';
    static readonly STATIC_ALERT_ICON = 'clock';
    static readonly DEFAULT_ICON = 'exclamation-triangle';
    static readonly GOOGLE_MAPS_JS_PATH = 'https://maps.googleapis.com/maps/api/js';

    @LocalStorage('settings.VEHICLE_DATA_REFRESH_INTERVAL', 60000)
    static VEHICLE_DATA_REFRESH_INTERVAL: number;

    @LocalStorage('settings.MAP_SHOWN_DETAILS', Settings.DEFAULT_MAP_SHOWN_DETAILS)
    static MAP_SHOWN_DETAILS: string[];

    static WORKING_TIMEZONE: string;
    static WORKING_DAYS: string[] = [];
    static WORKING_HOURS: {[key: string]: {start: number, end: number}[]};
    static WORKING_TIMES: {[key: string]: number} = {};

    static WARNING_DURATION = 5000;
    static SUPPORTED_LANGS = ['en', 'hu'];
    static CAN_DATA_NAMES = ['ignition', 'speed', 'private_or_official',
    'rpm', 'engine_rpm', 'accelerator_pedal_pos', 'fuel_level', 'fuel_level_percent_can', 'fuel_level_percent', 'odometer'];

    static BASE_URL = environment.baseUrl;
    static AUTH_URL = `${Settings.BASE_URL}/auth`;

    static VEHICLE_URL = `${Settings.BASE_URL}/vehicle/v1`;
    static VEHICLE_REPORT_URL = `${Settings.BASE_URL}/vehicle/report`;
    static GROUP_URL = `${Settings.BASE_URL}/group`;
    static PERSON_URL = `${Settings.BASE_URL}/person`;
    static ALERT_URL = `${Settings.BASE_URL}/alert/firedalert`;
    static USERACCOUNT_URL = `${Settings.BASE_URL}/useraccount/v1`;
    static VERSION_URL = Settings.BASE_URL + '/v0/version';
    static IMPRESSUM_URL = Settings.BASE_URL + '/v0/impressum';
    static FLEET_REPORT_URL = `${Settings.VEHICLE_REPORT_URL}/drive-statistics`;
    static DRIVERS_REPORT_URL = `${Settings.VEHICLE_REPORT_URL}/driver-statistics`;
    static ALERT_TEMPLATE_URL = `${Settings.BASE_URL}/alert/template`;
    static ALERT_CONFIG_URL = `${Settings.BASE_URL}/alert/config`;
    static STATIC_ALERT_URL = `${Settings.BASE_URL}/alert/static`;
    static CONTACT_URL = `${Settings.BASE_URL}/alert/contact`;
    static EXPORT_URL = `${Settings.BASE_URL}/util/v0/export`;

    static readonly movingSymbol = {
        path: 0,
        scale: 12,
        fillOpacity: 1,
        fillColor: '#89bf42',
        strokeColor: '#ffffff',
        strokeWeight: 3
      };

    static readonly standbySymbol = {
        path: 0,
        scale: 12,
        fillOpacity: 1,
        fillColor: '#3f545e',
        strokeColor: '#ffffff',
        strokeWeight: 3
    };

    static SIDENAV_ITEMS: SidenavItem[] = [
        {
            icon: 'home',
            name: '',
            url: '',
            class: ''
        },
        {
            icon: '',
            name: 'statistic',
            url: '/statistic',
            class: 'beta'
        },
        {
            icon: '',
            name: 'alert',
            url: '/alert',
            class: 'beta'
        },
        {
            icon: '',
            name: 'settings',
            url: '/settings',
            class: ''
        },
        {
            icon: '',
            name: 'help',
            url: '',
            class: ''
        },
        {
            icon: '',
            name: 'imprint',
            url: '/impressum',
            class: ''
        },
        {
            icon: 'new_releases',
            name: 'news',
            url: '',
            class: ''
        }
    ];

    static getAlertIcon(alertType: string): string {
        switch (alertType) {
          case 'STATIC_ALERT':
            return Settings.STATIC_ALERT_ICON;
          case 'GEOFENCING_ALERT':
            return Settings.GEOFENCING_ALERT_ICON;
          default:
            return Settings.DEFAULT_ICON;
        }
    }

    static getRankBgColor(rank: number): string {
        switch (rank) {
            case 1:
                return '#ef5350';
            case 2:
                return '#FF7043';
            case 3:
                return '#FFCA28';
            case 4:
                return '#D4E157';
            case 5:
                return '#66BB6A';
        }
    }
}
