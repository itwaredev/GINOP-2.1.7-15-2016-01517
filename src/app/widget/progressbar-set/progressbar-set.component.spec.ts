import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ProgressbarSetPage } from './progressbar-set.page';

describe('ProgressbarSetPage', () => {
  let component: ProgressbarSetPage;
  let fixture: ComponentFixture<ProgressbarSetPage>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ProgressbarSetPage ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ProgressbarSetPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
