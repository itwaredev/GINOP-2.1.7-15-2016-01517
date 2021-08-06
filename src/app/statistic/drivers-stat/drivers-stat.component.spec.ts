import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { DriversStatComponent } from './drivers-stat.component';

describe('DriversStatComponent', () => {
  let component: DriversStatComponent;
  let fixture: ComponentFixture<DriversStatComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ DriversStatComponent ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DriversStatComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
