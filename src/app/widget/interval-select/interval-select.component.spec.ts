import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { IntervalSelectComponent } from './interval-select.component';

describe('IntervalSelectComponent', () => {
  let component: IntervalSelectComponent;
  let fixture: ComponentFixture<IntervalSelectComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ IntervalSelectComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(IntervalSelectComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
