import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { FormForModelComponent } from './form-for-model.component';

describe('FormForModelComponent', () => {
  let component: FormForModelComponent;
  let fixture: ComponentFixture<FormForModelComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ FormForModelComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(FormForModelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
