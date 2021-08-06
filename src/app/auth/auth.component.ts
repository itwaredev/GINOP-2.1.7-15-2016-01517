import { Component, ViewChild } from '@angular/core';
import { AuthService } from '../auth/auth.service';
import { Platform } from '@ionic/angular';
import { mouseoverHandler } from '../util/utils';
import { FormForModelComponent } from '../widget/form-for-model/form-for-model.component';
import { MatButton } from '@angular/material';

@Component({
  selector: 'app-auth',
  templateUrl: './auth.component.html',
  styleUrls: ['./auth.component.scss']
})
export class AuthComponent {
    @ViewChild('loginbtn') loginBtn: MatButton;
    @ViewChild('form') form: FormForModelComponent;

    metadata = {
        name: 'login',
        fields: [
            {
                name: 'customerName',
                type: 'text',
                validators: {required: true},
                capitalize: 'off'
            },
            {
                name: 'username',
                type: 'text',
                validators: {required: true},
                capitalize: 'off'
            },
            {
                name: 'password',
                type: 'password',
                validators: {required: true},
                capitalize: 'off'
            },
        ]
    };
    validity = false;
    onfocus = false;
    shouldHide = false;

    readonly credentials = { customerName: null, username: null, password: null};

    constructor(private authService: AuthService, private platform: Platform) {
        this.platform.ready().then(_ => {
            this.shouldHide = this.platform.platforms().includes('android') || this.platform.platforms().includes('ios');
            if (this.platform.platforms().includes('ios')) {
                mouseoverHandler(this.loginBtn['el']);
            }
        });
    }

    login(): void {
        if (this.credentials.customerName && this.credentials.username && this.credentials.password) {
            this.validity = false;
            this.authService.login(this.credentials.customerName, this.credentials.username, this.credentials.password)
                .then(
                    _ => {
                        setTimeout(() => {
                            this.credentials.customerName = this.credentials.username = this.credentials.password = null;
                            this.form.reset();
                        }, 1000);
                    },
                    e => {
                        if (e.status === 401) {
                            this.credentials.password = null;
                        } else {
                            this.validity = true;
                        }
                    }
                );
        }
    }

    formFocus(param: {key: string, subEntityName: string}): void {
        this.onfocus = true;
    }

    formBlur(param: {key: string, subEntityName: string}): void {
        this.onfocus = false;
    }
}
