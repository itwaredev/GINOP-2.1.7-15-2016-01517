import { enableProdMode } from '@angular/core';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';

import { AppModule } from './app/app.module';
import { environment } from './environments/environment';
import 'hammerjs';
declare const Hammer: any;

Hammer.defaults.touchAction = 'pan';

if (environment.production) {
  enableProdMode();
} else {
  window.onerror = function(event) {
    alert(event);
  };
}

platformBrowserDynamic().bootstrapModule(AppModule)
  .catch(err => console.log(err));
