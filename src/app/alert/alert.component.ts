import { Component, OnInit, ViewChild } from '@angular/core';
import { AuthService } from '../auth/auth.service';
import { AlertService } from '../service/alert.service';

@Component({
  selector: 'app-alert',
  templateUrl: './alert.component.html',
  styleUrls: ['./alert.component.scss'],
})
export class AlertComponent implements OnInit {

  users: any[] = [];
  contacts: any[] = [];

  constructor(private authService: AuthService, private alertService: AlertService) { } 

  ngOnInit() {
    this.authService.getUsers().subscribe(res => this.users = res);
    this.alertService.getContacts().subscribe(res => {
      this.contacts = res;
      this.contacts.forEach(contact => {
        if (contact.contactType === 'push') {
          contact.contact = Number.parseInt(contact.contact, 10);
        }
      });
    });
  }

}
