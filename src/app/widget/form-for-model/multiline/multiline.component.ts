import {Component, EventEmitter,
  Input, OnInit, Output, OnDestroy,
  forwardRef, OnChanges, SimpleChange} from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { NG_VALUE_ACCESSOR, NG_VALIDATORS,
  ControlValueAccessor, FormControl, FormGroup, FormBuilder, Validator, ValidationErrors } from '@angular/forms';
import { getValidators } from '../form-for-model.component';

@Component({
  selector: 'app-multiline',
  templateUrl: './multiline.component.html',
  styleUrls: ['./multiline.component.scss'],
  providers: [
    { provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => MultilineComponent), multi: true },
    { provide: NG_VALIDATORS, useExisting: forwardRef(() => MultilineComponent), multi: true }
  ]
})
export class MultilineComponent implements ControlValueAccessor, Validator, OnInit, OnDestroy, OnChanges {
  @Input() field: any;
  @Output() change = new EventEmitter<any>();
  @Output() blur = new EventEmitter<any>();
  @Output() focus = new EventEmitter<any>();
  @Input() options: any[];
  @Input() prefix: string;
  @Input() required: boolean;

  @Input() value: {[key: string]: {}[]} = {};

  myForm = new FormGroup({});
  innerModel: {[key: string]: {}[]} = {};
  private control: FormControl;
  private propagateChange: any = () => { };

  constructor(private fb: FormBuilder, private translateService: TranslateService) { }

  ngOnInit() {
  }

  ngOnChanges(changes: {[propKey: string]: SimpleChange}): void {
    if (changes.options) {
      if (this.field.sectionSort) {
        this.options = changes.options.currentValue.sort(this.field.sectionSort);
      }
      changes.options.currentValue.forEach(key => {
        if (!this.innerModel[key]) {
          this.innerModel[key] = [];
        }
        this.value[key] = this.innerModel[key];
      });
      Object.keys(this.value).filter(key => this.options.indexOf(key) === -1).forEach(key => delete this.value[key]);
      this.createForm(Object.keys(this.innerModel).length > 0);
    }
    this.propagateChange(this.value);
    if (Object.keys(this.innerModel).length > 0) {
      this.change.emit();
    }
  }

  createForm(changed: boolean = true): void {
    const groups = {};
    this.options.forEach(opt => this.innerModel[opt].forEach((val, ind) => this.field.fields.forEach(subField => {
      const params: any[] = [
        {
          value: val[subField.name],
          disabled: this.field.readonly || subField.readOnly
        }
      ];
      if (subField.validators) {
        params.push(getValidators(subField.validators));
      }
      groups[this.field.name + ',' + opt + ',' + ind + ',' + subField.name] = params;
    })));
    this.myForm = this.fb.group(groups);
    if (changed) {
      setTimeout(() => {
        this.control.updateValueAndValidity();
        this.change.emit();
      }, 0);
    }
  }

  writeValue(value: {[key: string]: {}[]}): void {
    if (value) {
      const changed = JSON.stringify(value) !== JSON.stringify(this.value) && Object.keys(this.innerModel).length > 0;
      this.value = value;
      this.innerModel = {...this.value};
      this.options = Object.keys(this.value);
      if (this.field.sectionSort) {
        this.options = this.options.sort(this.field.sectionSort);
      }
      this.createForm(changed);
    }
  }
  registerOnChange(fn: any): void {
    this.propagateChange = fn;
  }
  registerOnTouched(fn: any): void {

  }
  setDisabledState?(isDisabled: boolean): void {
    this.field.readonly = isDisabled;
  }
  validate(c: FormControl): ValidationErrors {
    this.control = c;
    const valid = {};
    Object.keys(this.myForm.controls).forEach(key => {
      this.myForm.controls[key].updateValueAndValidity();
      if (this.myForm.controls[key].errors) {
        Object.keys(this.myForm.controls[key].errors).forEach(error => valid[error] = this.myForm.controls[key].errors[error]);
      }
    });
    return Object.keys(valid).length ? valid : null;
  }

  buildLabel(baseLabel: string, translateKey: string): string {
    const trns = this.translateService.instant(translateKey.toUpperCase());
    return trns === translateKey.toUpperCase() ? baseLabel : trns;
  }

  update(section: any, index: number, subfield: string, value: any): void {
    this.innerModel[section][index][subfield] = value;
    setTimeout(() => {
      this.control.updateValueAndValidity();
      this.change.emit();
    }, 0);
  }

  add(section: any): void {
    if (!this.innerModel[section]) {
      this.innerModel[section] = [];
    }
    this.innerModel[section].push({});
    this.createForm();
  }

  remove(section: any, index: number): void {
    this.innerModel[section].splice(index, 1);
    this.createForm();
  }

  ngOnDestroy(): void {
  }
}
