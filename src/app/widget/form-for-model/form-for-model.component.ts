import {
  Component, Input, Output, EventEmitter, DoCheck, KeyValueDiffers, OnChanges, SimpleChange, OnDestroy, ViewChild
} from '@angular/core';
import { FormGroup, FormBuilder, Validators, FormGroupDirective, ValidatorFn, FormControl } from '@angular/forms';
import { KeyValueDiffer, KeyValueChangeRecord } from '@angular/core/src/change_detection/differs/keyvalue_differs';
import { TranslateService } from '@ngx-translate/core';
import { AuthService } from '../../auth/auth.service';
import { first } from 'rxjs/operators';
import { Subscription } from 'rxjs';
import { SafedatePipe } from 'src/app/util/safedate.pipe';

@Component({
  selector: 'app-form-for-model',
  templateUrl: './form-for-model.component.html',
  styleUrls: ['./form-for-model.component.scss']
})
export class FormForModelComponent implements DoCheck, OnChanges, OnDestroy {
  public myForm: FormGroup = new FormGroup({});
  @ViewChild(FormGroupDirective) fgDirective: FormGroupDirective;

  @Input() metadata;
  @Input() model;
  @Input() resetOnChanges = true;
  @Input() dirtyMap = {};
  @Output() submit: EventEmitter<any> = new EventEmitter();
  @Output() validationChanged: EventEmitter<boolean> = new EventEmitter();
  @Output() focus: EventEmitter<{key: string, subEntityName: string}> = new EventEmitter();
  @Output() changed: EventEmitter<{key: string, subEntityName: string}> = new EventEmitter();
  @Output() blur: EventEmitter<{key: string, subEntityName: string}> = new EventEmitter();

  private valueChangeSubscription: Subscription;
  private revalidationSubscriptions: Subscription[] = [];

  log = console.log.bind(console);
  dates = {};
  arrays = {};
  colors = {};
  linkedselects = {};
  linkedselectors = {};
  options = {};
  modelDiffer: KeyValueDiffer<any, any>;
  metadataDiffer: any;
  noCheckNeeded: boolean;
  accessMap = {};
  typesByName = {};
  fieldsByName = {};
  afterFormCreated: boolean;
  hidePassword = true;

  preValues = {};
  validateOn = {};

  submitUpdates = {};
  lastSubmitEvent;

  public dirty = false;

  constructor(public fb: FormBuilder, public differs: KeyValueDiffers, public authService: AuthService,
  private translateService: TranslateService, private datePipe: SafedatePipe) {
    this.modelDiffer = differs.find({}).create();
    this.metadataDiffer = differs.find({}).create();
  }

  private checkUpdate(prop: KeyValueChangeRecord<any, any>) {
    if (this.myForm.controls[prop.key] !== undefined) {
      const field = this.fieldsByName[prop.key];
      if (this.typesByName[prop.key] === 'autocomplete') {
        if (field.initValue) {
          field.initValue(prop.currentValue).pipe(first()).subscribe(result =>
            this.myForm.controls[prop.key].setValue(field.objectLabelField ? result[field.objectLabelField] : result.megnevezes)
          );
        }
      } else {
        this.myForm.controls[prop.key].setValue(field.formatValue ? field.formatValue(prop.currentValue) : prop.currentValue);
      }
    }
  }

  ngDoCheck() {
    if (this.afterFormCreated) {
      this.validationChanged.emit(this.myForm.valid);
      this.afterFormCreated = false;
    }

    const modelChanges = this.modelDiffer.diff(this.model);
    const metadataChanges = this.metadataDiffer.diff(this.metadata);
    if (metadataChanges /* || modelChanges && !this.noCheckNeeded */) {
      this.createForm();
      this.afterFormCreated = true;
    } else if (modelChanges && !this.noCheckNeeded) {
      modelChanges.forEachChangedItem(prop => {
        // console.log(`${prop.key}: ${prop.currentValue}`);
        this.checkUpdate(prop);
      });
      modelChanges.forEachAddedItem(prop => {
        this.checkUpdate(prop);
      });
      modelChanges.forEachRemovedItem(prop => {
        if (this.myForm.controls[prop.key] && this.myForm.controls[prop.key].setValue) {
          this.myForm.controls[prop.key].setValue(null);
        }
      });
    }
    this.noCheckNeeded = false;
  }

  ngOnChanges(changes: {[propKey: string]: SimpleChange}) {
    // If model changed, reset the form
    if (changes['model'] && this.resetOnChanges) {
      // this.createForm();
    }
  }

  createForm() {
    this.arrays = {};
    this.colors = {};
    this.linkedselects = {};
    this.options = {};
    this.accessMap = {};
    this.fieldsByName = {};
    const group = {};

    if (this.metadata.groups === undefined) {
      this.metadata.groups = [];
      this.metadata.groups.push({ fields: this.metadata.fields });
    }

    const subEntityName = this.metadata.subEntityName;

    this.metadata.groups.map(fieldGroup => {
      if (subEntityName) {
        this.dirtyMap[subEntityName] = {};

        if (!this.model[subEntityName]) {
          this.model[subEntityName] = {};
        }
      }
      fieldGroup.fields.map(field => {
        if (subEntityName && !field.subEntityName) {
          field.subEntityName = subEntityName;
        }

        if (!field.validators) {
          field.validators = {};
        }

        if (this.metadata.generateFieldAccess && !field.access && subEntityName) {
          field.access = this.metadata.name + '-' + subEntityName;
        } else if (this.metadata.generateFieldAccess && !field.access) {
          field.access = this.metadata.name + '-' + field.name;
        }
        if (field.access /*&& !this.authService.hasAccess(field.access, 'read')*/) {
          return; // don't create form control for this field if user does not have read permission
        }
        this.typesByName[field.name] = field.type;
        this.accessMap[field.name] = field.access;
        this.fieldsByName[field.name] = field;
        if (field.tooltip === undefined && this.metadata.autoTooltip) {
          const tooltipKey = [this.metadata.name, 'TOOLTIP', field.displayName || field.name].join('.').toUpperCase();
          field.tooltip = this.translateService.instant(tooltipKey);
          if (field.tooltip === tooltipKey) {
            field.tooltip = this.translateService.instant([this.metadata.name, field.displayName || field.name].join('.').toUpperCase());
          }
        }
        const params = [];
        let value;
        if (this.model) {
          if (field.type === 'date' || field.type === 'datetime' || field.type === 'datepicker') {
            const val = subEntityName ? this.model[subEntityName][field.name] : this.model[field.name];
            value = val ? new Date(val) : val;
          } else if (field.type === 'multiselect' && subEntityName) {
            value = this.model[subEntityName][field.name] ?
              (Array.isArray(this.model[subEntityName][field.name]) ?
                this.model[subEntityName][field.name] :
                Object.keys(this.model[subEntityName][field.name])) :
              [];
          } else if (field.type === 'multiselect') {
            value = this.model[field.name] ?
              (Array.isArray(this.model[field.name]) ?
                this.model[field.name] :
                Object.keys(this.model[field.name])) :
              [];
          } else if (field.type === 'select' || field.type === 'object-select' || field.type === 'multiline') {
            if ('linkto' in field) {
              this.linkedselects[field.name] = field.linkto;
              this.linkedselectors[field.name] = field.linkselector;
              if ('DEFAULT' in field.options) {
                this.options[field.name] = field.options.DEFAULT;
              } else {
                this.options[field.name] = [];
              }
            } else {
              this.options[field.name] = field.options;
            }
            value = subEntityName ? this.model[subEntityName][field.name] : this.model[field.name];
            if (value && typeof value === 'object' && (field.objectValueField || field.objectLabelField)) {
              value = field.objectValueField ? value[field.objectValueField] : value['id'];
            }
          } else {
            value = subEntityName ? this.model[subEntityName][field.name] : this.model[field.name];
          }
        }
        if (value && field.type === 'text') {
          if (value instanceof Date || value.getDate) {
            if (value.toString() === 'Invalid Date') {
              value = '';
            }
            value = this.datePipe.transform(value, {year: 'numeric', month: '2-digit', day: '2-digit'});
          }
        }

        if (field.default && !value) {
          value = field.default;
        }

        if (field.formatValue) {
          value = field.formatValue(value);
        }

        // add object for formbuilder
        params.push({
          value: value,
          disabled: this.metadata.readonly || field.readOnly/* || (
            this.metadata.noCheck ? false :
              (field.access ? !this.authService.hasAccess(field.access, this.formType()) :
                !this.authService.hasAccess(this.metadata.name, this.formType())))*/
        });

        if (field.validateOn) {
          this.validateOn[field.name] = this.validateOn[field.name] || [];
          this.validateOn[field.name].push(field.validateOn);
        }

        // add validators to form builder
        if (field.validators && field.type !== 'multiline') {
          params.push(getValidators(field.validators));
        }
        // add field to group
        group[field.name] = params;
      });
    });


    this.myForm = this.fb.group(group);

    if (this.valueChangeSubscription) {
      this.valueChangeSubscription.unsubscribe();
    }
    this.valueChangeSubscription = this.myForm.valueChanges.subscribe(() => {
      this.validationChanged.emit(this.myForm.valid);
      this.dirty = this.myForm.dirty;
    });

    this.registerRevalidations();

    Object.keys(this.linkedselects).forEach(key => this.updateLinkedSelects(key));

    this.setFieldAccessability();
  }

  /**
  *	Subscribes for user role changes and sets form field accessibility
  */
  public setFieldAccessability(): void {
    Object.keys(this.myForm.controls).map(key => {

      let disabled;

      if (this.metadata.readonly) {
        disabled = true;
      } else if (this.metadata.noCheck) {
        disabled = false;
      }/* else if (this.accessMap[key]) {
        disabled = !this.authService.hasAccess(this.accessMap[key], this.formType());
      } else {
        disabled = !this.authService.hasAccess(this.metadata.name, this.formType());
      }*/

      if (disabled) {
        this.myForm.controls[key].disable();
      } else {
        this.myForm.controls[key].enable();
      }
    });
  }

  /**
  *	Add revalidation attempts to fields specified in metadata
  *	In metadata revalidate must be a string or array
  *
  *	@return True if registration went well
  *			False if value of revalidate was not string or array
  */
  public registerRevalidations(): boolean {
    for (const revSub of this.revalidationSubscriptions) {
      revSub.unsubscribe();
    }
    this.revalidationSubscriptions.length = 0;

    this.metadata.groups.map(fieldGroup => {
      fieldGroup.fields.map(field => {

        // if revalidate property exists
        if (field.revalidate) {
          if (typeof field.revalidate === 'string') {
            // check if string
            field.revalidate = [field.revalidate];
          } else if (!((<any>field.revalidate) instanceof Array)) {
            // check if not an array
            // return false in order to show property was not an array or string
            return false;
          }

          this.revalidationSubscriptions.push(
            // subscribe for field value change
            this.myForm.controls[field.name].valueChanges.subscribe(() => {

              // add revalidation attempt to all desired field specified in revalidate metadata
              for (const fieldName of field.revalidate) {
                this.myForm.controls[fieldName].updateValueAndValidity({ onlySelf: true, emitEvent: true });
              }

              // return true in order to show process went well
              return true;
            })
          );
        }
      });
    });

    return true;
  }

  updateLinkedSelects(key) {
    const target = Object.keys(this.linkedselects).find(item => this.linkedselects[item] === key);
    if (!target) {
      return;
    }
    // Object.keys(this.linkedselects).map(target => {
      let valueToSelect = null;
      let linkedValue = this.myForm.value[this.linkedselects[target]];
      let model = this.preValues[this.linkedselects[target]];
      if (linkedValue && typeof linkedValue === 'object' && this.linkedselectors[target]) {
          linkedValue = linkedValue[this.linkedselectors[target]];
      }
      if (model && typeof model === 'object' && this.linkedselectors[target]) {
          model = model[this.linkedselectors[target]];
      }
      this.metadata.groups.map(fieldGroup => {
        fieldGroup.fields.map(field => {
          if (field.name === target) {
            this.options[field.name] = field.options[linkedValue] || linkedValue;
            if  (this.options[field.name] && this.options[field.name].length === 1 && this.typesByName[target] !== 'multiline') {
              valueToSelect = this.options[field.name][0];
              if (typeof valueToSelect === 'object') {
                valueToSelect = valueToSelect[field.objectValueField || 'id'];
              }
            }
          }
        });
      });
      // reset the value of our select if the value of the linked select has changed
      if (model !== linkedValue) {
        // this.myForm.controls[target].setValue(valueToSelect); //this can overwrite autocomplete inputs with object values
        this.myForm.controls[target].setValue(valueToSelect);
        this.updateModel(target);
      }
    // });
  }

  updateModel(key, subEntityName?) {
    this.noCheckNeeded = true;
    // console.log(key, subEntityName);
    // this.updateLinkedSelects(key);
      if (subEntityName && this.dirtyMap) {
        this.dirtyMap[subEntityName][key] = this.myForm.controls[key].dirty;
      } else if (this.dirtyMap) {
        this.dirtyMap[key] = this.myForm.controls[key].dirty;
      }

      let value = this.myForm.value[key];
        if (this.myForm.value[key] instanceof Date && this.fieldsByName[key].adjustToUTC) {
          value = new Date(this.myForm.value[key].getTime() + this.myForm.value[key].getTimezoneOffset() * 60000);
        }
        if (subEntityName) {
          this.model[subEntityName][key] = value;
        } else {
          this.model[key] = value;
        }
    this.updateLinkedSelects(key);

    const skipValidation = this.preValues[key] === (subEntityName ? this.model[subEntityName][key] : this.model[key])
      && this.typesByName[key] !== 'multiline';

    // Object.keys(this.myForm.value).map(key => {
      if (subEntityName) {
        this.preValues[key] = this.model[subEntityName][key];
      } else {
        this.preValues[key] = this.model[key] || undefined;
      }
    // });
    if (this.fieldsByName[key].clearOnChange) {
      if (Array.isArray(this.fieldsByName[key].clearOnChange)) {
        this.fieldsByName[key].clearOnChange.forEach(clear => {
          this.myForm.controls[clear].setValue(null);
          this.updateModel(clear);
        });
      } else {
        this.myForm.controls[this.fieldsByName[key].clearOnChange].setValue(null);
        this.updateModel(this.fieldsByName[key].clearOnChange);
      }
    }

    // proxy dirty flag outside component
    // this need because in life cycle there are moments when form is not created yet, but we need the false value
    this.dirty = this.myForm.dirty;
    setTimeout(() => {
      if (!skipValidation) {
        if (this.validateOn[key]) {
          this.validateOn[key].forEach(element => {
            this.myForm.controls[element].updateValueAndValidity({onlySelf: true, emitEvent: false});
          });
        }
        this.myForm.updateValueAndValidity({onlySelf: true, emitEvent: true});
        this.validationChanged.emit(this.myForm.valid);
        this.changed.emit({key, subEntityName});
      }

      const submitKeyInd = this.submitUpdates[key];
      if (submitKeyInd != null) {
        delete this.submitUpdates[key];
        if (Object.keys(this.submitUpdates).length === 0 && this.myForm.valid) {
          setTimeout(() => {
          this.submit.emit(this.lastSubmitEvent);
          this.lastSubmitEvent = null;
          }, 300);
        }
      }
    }, 0);
  }

  protected dateclick(event) {
    event.stopPropagation();
    event.target.blur();
    event.target.parentElement.nextElementSibling
    .getElementsByTagName('mat-datepicker-toggle')[0]
    .getElementsByTagName('button')[0].click();
  }

  clearDate(field, subField) {
    this.myForm.controls[field].setValue(null);
    this.updateModel(field, subField);
  }

  formType() {
    return this.model.id ? 'edit' : 'create';
  }

  onSubmit(event) {
    event.stopPropagation();
    this.lastSubmitEvent = event;
    this.onBlur();
    Object.keys(this.myForm.value).forEach(key => {
      this.submitUpdates[key] = 1;
      this.updateModel(key, this.fieldsByName[key].subEntityName);
    });
  }

  onBlur(key?: string, subEntityName?: string) {
    if (!key) {
      (document.activeElement as HTMLElement).blur();
    }
    this.blur.emit({key, subEntityName});
  }

  onFocus(key: string, subEntityName?: string): void {
    this.focus.emit({key, subEntityName});
  }

  close(): void {
    const overlays = document.body.getElementsByClassName('cdk-overlay-backdrop');
    if (overlays.length) {
      (overlays[0] as HTMLElement).click();
    }
  }

  reset(): void {
    this.fgDirective.resetForm();
  }

  checkFieldDependency(field: any): any {
    let value = true;
    if (typeof field.dependsOn === 'function') {
      value = field.dependsOn();
    } else if (typeof field.dependsOn === 'string') {
      if (field.dependsOn.startsWith('!')) {
        value = !this.model[field.dependsOn.substring(1)];
      } else {
        value = this.model[field.dependsOn];
      }
    }
    if (!value && this.dirtyMap) {
      this.dirtyMap[field.name] = false;
    }
    if (field.dependsOn && field.dependsOnValue) {
      if (Array.isArray(field.dependsOnValue)) {
        value = field.dependsOnValue.indexOf(value) > -1;
      } else {
        value = value === field.dependsOnValue;
      }
    }
    return value;
  }

  public refreshOptions() {
    this.options = {};
    this.linkedselects = {};
    this.linkedselectors = {};
    this.metadata.groups.map(group => {
      group.fields.map(field => {
        if (field.type === 'select' || field.type === 'object-select' || field.type === 'multiline') {
          if ('linkto' in field) {
            this.linkedselects[field.name] = field.linkto;
            this.linkedselectors[field.name] = field.linkselector;
            if ('DEFAULT' in field.options) {
              this.options[field.name] = field.options.DEFAULT;
            } else {
              this.options[field.name] = [];
            }
          } else {
            this.options[field.name] = field.options;
          }
        }
      });
    });
  }

  protected buildLabel(baseLabel: string, translateKey: string): string {
    const trns = this.translateService.instant(translateKey.toUpperCase());
    return trns === translateKey.toUpperCase() ? baseLabel : trns;
  }

  get defaultMinValue() {
    return -9007199254740991;
  }

  get defaultMaxValue() {
    return 9007199254740991;
  }

  ngOnDestroy(): void {
    if (this.valueChangeSubscription) {
      this.valueChangeSubscription.unsubscribe();
    }
    for (const revSub of this.revalidationSubscriptions) {
      revSub.unsubscribe();
    }
    this.revalidationSubscriptions.length = 0;
  }
}

/**
  *	Returns an array of validators for FormBuilder
  *
  *	@param validators Array of validator config objects
  *
  *	@return Array of Validators which can be type of Validator, ValidatorFn
  */
 export function getValidators(validators: {[key: string]: any}): ValidatorFn[] {
  return Object.keys(validators).map(validator => {
    if (validator === 'pattern') {
      return Validators.pattern(validators.pattern);
    } else if (validator === 'required' && validators.required) {
      return Validators.required;
    } else if (validator === 'email') {
      return Validators.email;
    } else if (validator === 'min') {
      return Validators.min(validators.min);
    } else if (validator === 'max') {
      return Validators.max(validators.max);
    } else if (typeof validators[validator] === 'function') {
      return (control: FormControl | null) => {
        const err = validators[validator](control);
        return err != null ? {[validator]: err} : null;
      };
    }

    return null;
  }).filter(val => val != null);
}
