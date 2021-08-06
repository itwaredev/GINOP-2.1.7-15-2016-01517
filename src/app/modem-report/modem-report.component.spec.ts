import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ModemReportComponent } from './modem-report.component';

describe('ModemReportComponent', () => {
  let component: ModemReportComponent;
  let fixture: ComponentFixture<ModemReportComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ModemReportComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ModemReportComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
