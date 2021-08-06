import {ChangeDetectorRef, Component, EventEmitter, Input, OnInit, Output, ViewChild, OnDestroy} from '@angular/core';
import { MatAutocomplete } from '@angular/material';
import { first } from 'rxjs/operators';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-autocomplete',
  templateUrl: './autocomplete.component.html',
  styleUrls: ['./autocomplete.component.css']
})
export class AutocompleteComponent implements OnInit, OnDestroy {
  @ViewChild('auto') autocomplete: MatAutocomplete;
  @Input('parentFormControl') parentFormControl;
  @Input('field') field;
  @Output('updateModel') updateModel = new EventEmitter<any>();
  @Input('disabled') disabled: boolean;
  @Input('rawInputSupport') rawInputSupport = false;

  filterValue: any;
  filteredValues: Array<Object>;
  options: Array<Object>;
  initVal: boolean;

  private obsSubscription: Subscription;

  constructor(private cdr: ChangeDetectorRef) { }

  ngOnInit() {
   this.initVal = false;
    if (this.parentFormControl.controls[this.field.name].value && this.field.initValue) {
        this.field.initValue(this.parentFormControl.controls[this.field.name].value).pipe(first()).subscribe(result => {
          if (result) {
            const id = !isNaN(result.id) ? Number.parseInt(result.id) : result.id;
            this.filterValue = { id: id, name: result[this.field.objectLabelField || 'name'] };
            this.initVal = true;
          }
        });
    }

    this.filteredValues = [];

    const obs = this.parentFormControl.valueChanges
      .debounceTime(300) // TODO: may server calls wont be neccessary after using expandable search forms on every page
      .distinctUntilChanged()
      .filter(changes => changes[this.field.name] || changes[this.field.name] === '');
    this.obsSubscription = obs.subscribe(valueChanges => {
      if (!this.initVal) {
        const filterValue = valueChanges[this.field.name];

        if (filterValue && typeof filterValue === 'string' && filterValue.length > 0) {
          if (!this.rawInputSupport) {
            valueChanges[this.field.name] = undefined;
            this.parentFormControl.controls[this.field.name].setErrors({noValueSelected: true});
          }
          this.updateModel.emit();

          if (filterValue.length > 2) {
            this.field.applyFilter(filterValue).pipe(first()).subscribe(result => {
              this.filteredValues = result.map(item => {
                const id = !isNaN(item.id) ? Number.parseInt(item.id) : item.id;
                return {id: id, name: item[this.field.objectLabelField || 'name']};
              });
            });
          } else {
            this.filteredValues = [];
          }
        } else if (filterValue && typeof filterValue === 'object') {
          valueChanges[this.field.name] = filterValue['id'];
          this.updateModel.emit();
          this.filteredValues = [];
        } else {
          valueChanges[this.field.name] = undefined;
          this.updateModel.emit();
          this.filteredValues = [];
        }
      } else {
        this.initVal = false;
      }
    });
  }

  onBlur() {
    if (this.field.blur) {
      this.field.blur();
    }

    if (this.filterValue) {
      const fullMatch = this.filteredValues.find(item => item['name'].toLowerCase() === this.filterValue.toLowerCase());
      if (fullMatch) {
        this.filterValue = fullMatch;
        this.cdr.detectChanges();
      }
    }
  }

  displayFn(option): string {
    if (option && typeof option === 'object') {
      return option.name;
    }

    return option;
  }

  ngOnDestroy(): void {
    this.obsSubscription.unsubscribe();
  }
}
