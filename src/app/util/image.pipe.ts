import { AuthHttpClient } from './http';
import { Pipe, PipeTransform } from '@angular/core';
import { ResponseContentType } from '@angular/http';
import { SafePipe } from './safe.pipe';

@Pipe({name: 'image'})
export class ImagePipe implements PipeTransform {
  static SLICE_SIZE = 120000; // Firefox can handle the JS core limit but Chrome can't

  constructor(private http: AuthHttpClient, private safePipe: SafePipe) {}

  transform(url: string) {
    if (!url) {
      return;
    }

    return new Promise<any>(resolve => {
      this.http.get(url, {responseType: ResponseContentType.Blob}).toPromise().then(response => {
        resolve(
          this.safePipe.transform(
            window.URL.createObjectURL(
              response.blob()
            )
          )
        );
      });
    });
  }
}
