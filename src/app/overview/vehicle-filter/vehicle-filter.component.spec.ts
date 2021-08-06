import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { VehicleFilterComponent } from './vehicle-filter.component';

describe('VehicleFilterComponent', () => {
  let component: VehicleFilterComponent;
  let fixture: ComponentFixture<VehicleFilterComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ VehicleFilterComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(VehicleFilterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
