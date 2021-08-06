import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { VehicleStatusComponent } from './vehicle-status.component';

describe('VehicleStatusComponent', () => {
  let component: VehicleStatusComponent;
  let fixture: ComponentFixture<VehicleStatusComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ VehicleStatusComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(VehicleStatusComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
