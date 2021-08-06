import { Component, Input, TemplateRef } from '@angular/core';

@Component({
  selector: 'app-template-list',
  templateUrl: './template-list.component.html',
  styleUrls: ['./template-list.component.scss']
})
export class TemplateListComponent {
  @Input() list: any[];
  @Input() nodeTitle: string;
  @Input() nodeClass: string;
  @Input() elementTmpl: TemplateRef<any>;

  constructor() { }
}
