import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { VehicleMapComponent } from './vehicle-map.component';

describe('VehicleMapComponent', () => {
  let component: VehicleMapComponent;
  let fixture: ComponentFixture<VehicleMapComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ VehicleMapComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(VehicleMapComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
