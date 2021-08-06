import { TranslateService } from '@ngx-translate/core';
import { Component, OnInit, AfterViewInit, Input, Output, EventEmitter, ViewChild,
         TemplateRef, OnChanges, SimpleChanges, ElementRef, AfterViewChecked, DoCheck,
         KeyValueDiffers, OnDestroy, ViewChildren, QueryList } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { MatCheckbox, MatPaginator, MatSort, MatPaginatorIntl } from '@angular/material';
import { DataSource } from '@angular/cdk/collections';
import { Observable, BehaviorSubject, merge, fromEvent } from 'rxjs';
import { map, debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { trigger, state, style, transition, animate } from '@angular/animations';
import { SafedatePipe } from 'src/app/util/safedate.pipe';
import { StringNumberComparator } from 'src/app/util/comparators';

export enum FilterType {
  EQUALS, LIKE, EXCLUDE
}
export enum PageType {
  CLIENT = 'client',
  SERVER = 'server',
  NONE = 'none'
}
export class FilterChangedEvent {
  public changed: FilterValue;
  public values: FilterValue[];
}
export class FilterConfig {
  public name: string;
  public type: FilterType;
  public value?: any;

  constructor(name?: string, type?: FilterType, value?: any) {
    this.name = name;
    this.type = type;
    this.value = value;
  }
}
export class SmartTableDataSource extends DataSource<any> {
  private filterChange = new BehaviorSubject(new FilterChangedEvent());
  get filter(): FilterChangedEvent { return this.filterChange.value; }
  set filter(filter: FilterChangedEvent) { this.filterChange.next(filter); }
  public length;

  constructor(private paginator: MatPaginator, private dataChange: BehaviorSubject<any[]>, private sort: MatSort,
              private columnConfigChange: BehaviorSubject<any>, private pageType: PageType) {
    super();
  }

  connect(): Observable<any[]> {
    const displayDataChanges = <any[]>[
      this.filterChange,
      this.dataChange,
      this.paginator.page,
      this.columnConfigChange,
      this.sort.sortChange
    ];
    return merge(...displayDataChanges).pipe(map(() => {
      let filtered = [];
      if (this.dataChange.value) {
        const filters = [];
        Object.keys(this.columnConfigChange.value).map(key => {
          const column = this.columnConfigChange.value[key];
          if (column.filterable) {
            filters.push(new FilterConfig(column.name, column.filterType, column.filterValue));
          }
        });
        filtered = this.dataChange.value.slice().filter(item => {
          let result = true; // include all items if filter or filterConfig is empty
          filters.forEach(config => {
            if (this.filter && this.filter.values) {
              this.filter.values.forEach(filter => {
                const finalFilter = config.value || filter.value;
                if (filter.column === config.name) {
                  let configResult = true;
                  const itemValue = item[config.name] + '';
                  switch (config.type) {
                    case FilterType.LIKE: {
                      const match = itemValue.toLowerCase().match(finalFilter.toLowerCase());
                      configResult = match && match.length > 0;
                    }
                    break;
                    case FilterType.EQUALS: {
                      configResult = finalFilter ? itemValue.toLowerCase() === finalFilter.toLowerCase() : true;
                    }
                    break;
                    case FilterType.EXCLUDE: {
                      configResult = itemValue.toLowerCase() !== finalFilter.toLowerCase();
                    }
                    break;
                  }
                  result = result && configResult;
                }
              });
            }
          });
          return result;
        });
      }
      setTimeout(() => this.length = filtered.length);
      const sorted = filtered.slice();
      if (this.pageType === PageType.CLIENT || this.pageType === PageType.NONE) {
        if (this.sort && this.sort.active && this.sort.direction !== '') {
          const comparator = this.columnConfigChange.value[this.sort.active].comparator;
          const formatter = this.columnConfigChange.value[this.sort.active].dataFormatter;
          if (formatter) {
            sorted.sort((a, b) => comparator.compare(formatter(a), formatter(b), null, this.sort.direction));
          } else {
            sorted.sort((a, b) => comparator.compare(a, b, this.sort.active, this.sort.direction));
          }
        }
      }
      return this.pageType === PageType.CLIENT ?
        sorted.splice(this.paginator.pageIndex * this.paginator.pageSize, this.paginator.pageSize) : sorted;
    }));
  }

  disconnect() {}
}
export class ColumnConfig {
  public name: string;
  public displayName?: string;
  public headerLabel?: string;
  public actionColumn?: boolean;
  public statusColumn?: boolean;
  public checkStatus?: Function;
  public visible ? = true;
  public visibleByDefault ? = true;
  public template?: any;
  public sortable ? = true;
  public sortby?: string;
  public comparator ? = new StringNumberComparator();
  public filterable ? = false;
  public filterType?: FilterType;
  public filterValue?: any;
  public filterOptions?: FilterOption[];
  public dataFormatter?: Function;
  public enumType?: boolean;
  public width?: string;
  public resizeable ? = true;

  constructor(obj) {
    if (obj) {
      Object.keys(obj).map(key => {
        this[key] = obj[key];
      });
    }

  }
}
export class PaginationChangedEvent {
  public page: number;
  public size: number;
  public sort?: string;
  public direction?: string;
}
export class FilterValue {
  public column: string;
  public value: string;
}
export class FilterOption {
  public label: string;
  public value: string;
}

@Component({
  selector: 'app-smart-table',
  templateUrl: './smart-table.component.html',
  styleUrls: ['./smart-table.component.css'],
  animations: [
    trigger('rowExpand', [
      state('collapsed', style({height: '0px', opacity: 0, display: 'none'})),
      state('expanded', style({height: '*', opacity: 1})),
      transition('expanded <=> collapsed', [style({display: 'flex'}), animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)')])
    ])
  ]
})
export class SmartTableComponent implements OnInit, OnChanges, AfterViewInit, AfterViewChecked, DoCheck, OnDestroy {
  @ViewChild('selectAllCheckbox') protected selectAllCheckbox: MatCheckbox;
  @ViewChild('defaultCellTmpl') protected defaultCellTmpl: TemplateRef<any>;
  @ViewChildren('filterField') filters: QueryList<ElementRef>;
  @ViewChild('table') table;
  @ViewChild('table') tableElement: ElementRef;
  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;
  @ViewChild('exportButton') exportButton;
  @Input() modelName;
  @Input() columns: (string | ColumnConfig)[];
  @Input() checkbox;
  @Input() header;
  @Input() pageSize = 10;
  @Input() page = 0;
  @Input() totalSize;
  @Input() data;
  @Input() statusConfig;
  @Input() rowSelection = true;
  @Input() showFilter;
  @Input() localFilter = true;
  @Input() showColumnSelector = true;
  @Input() hideColumnSelectorElement;
  @Input() selectedRows = [];
  @Input() selectedRow;
  @Input() pageType: PageType = PageType.CLIENT;
  @Input() emptyMessage;
  @Input() selectedRowTemplate: TemplateRef<any>;
  @Output() rowsSelected: EventEmitter<any> = new EventEmitter();
  @Output() rowActivated: EventEmitter<any> = new EventEmitter();
  @Output() rowDeactivated: EventEmitter<any> = new EventEmitter();
  @Output() rowHighlighted: EventEmitter<any> = new EventEmitter();
  @Output() paginationChanged: EventEmitter<PaginationChangedEvent> = new EventEmitter();
  @Output() filterChanged: EventEmitter<FilterChangedEvent> = new EventEmitter();
  dataSource: SmartTableDataSource;
  displayedColumns = ['checkbox'];
  dataChange: BehaviorSubject<any[]> = new BehaviorSubject<any[]>([]);
  columnConfigChange: BehaviorSubject<any> = new BehaviorSubject<any>({});
  columnConfigByName = {};
  columnTemplates = {};
  lastPaginationChanged: PaginationChangedEvent;
  defaultFormat: (any, template) => string;
  columnSelectorOpened = false;
  selectableColumns = [];
  userSettings;
  configStorageKey: string;
  resizedColumn;
  lastColumn;
  totalWidth: number;
  columnLabelWidth = [];
  columnOriginalWidth = [];
  headerElement;
  lastX;
  exportModel = {};
  initialized = false;
  dataDiffer;
  actionColumn;
  statusColumn;
  maxSelectorWidth = 0;
  maxStatusColumnWidth = 0;

  closeHandler = (event) => {
    this.closeColumnSelector();
  }

  resizeHandler = (event) => {
    this.resizeColumn(event);
  }

  stopResizeHandler = (event) => {
    this.stopSizing(event);
  }

  constructor(private translateService: TranslateService, private elementRef: ElementRef, private datePipe: SafedatePipe,
    private activatedRoute: ActivatedRoute, private differs: KeyValueDiffers, private pageIntl: MatPaginatorIntl
  ) {
    this.dataDiffer = this.differs.find({}).create();
    this.pageIntl.itemsPerPageLabel = this.translateService.instant('TABLE.ITEMS');
    this.pageIntl.previousPageLabel = this.translateService.instant('TABLE.PREVIOUS');
    this.pageIntl.nextPageLabel = this.translateService.instant('TABLE.NEXT');
    this.pageIntl.getRangeLabel = (page: number, pageSize: number, length: number) => {
      return this.translateService.instant('TABLE.RANGE')
      .replace('{first}', page * pageSize + 1)
      .replace('{last}', (page + 1) * pageSize)
      .replace('{length}', length);
    };
    this.defaultFormat = (value: any, template: any): string => {
      if (!value) {
        return '';
      }
      if (!template && (value instanceof Date || value.getDate)) {
        if (value.toString() === 'Invalid Date') {
          return '';
        }
        return this.datePipe.transform(value, 'date');
      } else if (value.toString() === '[object Object]' && !template) {
        console.warn('<smart-table> cell value is Object.');
        return '[Object]';
      } else {
        return value;
      }
    };
  }

  ngOnInit() {
    const columnNames = this.columns.map(column => column['name'] || column);
    this.columns.map(column => {
      if (typeof column === 'string' || column.visible !== false) {
        this.selectableColumns.push(column);
      }
    });
    this.configStorageKey = 'smart-table-config-' + this.hash(this.activatedRoute.pathFromRoot
      .filter(pathPart => pathPart.routeConfig)
      .map(pathPart => pathPart.routeConfig.path)
      .join('/') + JSON.stringify(columnNames) + this.modelName);
    this.userSettings = JSON.parse(localStorage.getItem(this.configStorageKey)) || {};
    this.updateColumns();
    if (this.data instanceof Observable) {
      this.data.subscribe(data => this.createDataSource(data));
    } else {
      this.createDataSource(this.data);
    }
  }

  ngAfterViewInit() {
    this.filters.map(filter => {
      fromEvent(filter.nativeElement, 'keyup')
        .pipe(
          debounceTime(150),
          distinctUntilChanged()
        )
        .subscribe(() => this.fireFilterChangedEvent(filter.nativeElement.dataset.column, filter.nativeElement.value));
    });
    if (this.header !== false) {
      this.calculateColumnWidth();
    }
    merge(...[this.paginator.page, this.paginator.pageSizeOptions, this.sort.sortChange]).pipe(map(() => {})).subscribe(() => {
        const lastPag = {
                page: this.paginator.pageIndex,
                size: this.paginator.pageSize,
                sort: this.sort && this.sort.active && this.sort.direction !== '' ?
                  this.columnConfigByName[this.sort.active].sortby || this.sort.active : '',
                direction: this.sort && this.sort.active && this.sort.direction !== '' ? this.sort.direction : ''
              };
      if (this.lastPaginationChanged !== undefined &&
         (this.lastPaginationChanged.page !== lastPag.page ||
          this.lastPaginationChanged.size !== lastPag.size ||
          this.lastPaginationChanged.sort !== lastPag.sort ||
          this.lastPaginationChanged.direction !== lastPag.direction)
      ) {
          this.paginationChanged.emit(lastPag);
      }
      this.lastPaginationChanged = lastPag;
    });
  }

  ngAfterViewChecked() {
    if (this.header !== false && !this.initialized) {
      if (this.headerElement && this.headerElement.clientWidth > 0) {
        this.calculateColumnWidth();
      }
    }
  }

  ngDoCheck() {
    if (this.dataDiffer.diff(this.data)) {
      this.dataChange.next(this.data);
    }
  }

  ngOnDestroy() {
  }

  ngOnChanges(changes: SimpleChanges) {
    if (this.dataSource) {
      if (changes['data']) {
        this.dataChange.next(this.data);
        if (this.data.length <= this.paginator.pageIndex * this.paginator.pageSize && this.pageType === PageType.CLIENT) {
          this.paginator.pageIndex = 0;
        }
      }
      if (changes['columns']) {
        this.updateColumns();
        this.columnConfigChange.next(this.columnConfigByName);
      }
      if (changes['page']) {
        this.paginator.pageIndex = this.page;
      }
    }
  }

  filterOptionSelected(column, event) {
    this.filters.forEach(f => {
      if (f.nativeElement.dataset.column === column.name) {
        f.nativeElement.value = event.value;
      }
    });
    this.fireFilterChangedEvent(column.name, event.value);
  }

  private fireFilterChangedEvent(column, value) {
    const filterChangedEvent = new FilterChangedEvent();
    filterChangedEvent.changed = new FilterValue();
    filterChangedEvent.changed.column = column;
    filterChangedEvent.changed.value = value;
    filterChangedEvent.values = this.filters.map(f => {
      const filterValue = new FilterValue();
      filterValue.column = f.nativeElement.dataset.column;
      filterValue.value = f.nativeElement.value;
      return filterValue;
    });
    this.filterChanged.emit(filterChangedEvent);
    if (this.localFilter && this.dataSource) {
      this.paginator.pageIndex = 0;
      this.dataSource.filter = filterChangedEvent;
    }
  }

  getRightPadding() {
    return (this.maxSelectorWidth > 40 ? this.maxSelectorWidth + 12 : 29) + 'px';
  }

  calculateColumnWidth() {
    this.headerElement = this.elementRef.nativeElement.getElementsByTagName('mat-header-row')[0];
    if (this.headerElement.clientWidth <= 0) {
      // table is probably hidden, will try calculation during next AfterViewChecked event
      this.initialized = false;
      return;
    }

    if (this.showColumnSelector) {
      const selectors = this.elementRef.nativeElement.getElementsByClassName('mat-column-columnSelector');
      let tempMaxSelectorWidth = 0;
      for (const selector of selectors) {
        tempMaxSelectorWidth = Math.max(tempMaxSelectorWidth, selector.clientWidth);
      }
      setTimeout(() => this.maxSelectorWidth = tempMaxSelectorWidth);
    }

    this.totalWidth = this.headerElement.clientWidth
    - Number.parseInt(window.getComputedStyle(this.headerElement, null).getPropertyValue('padding-left'), 10)
    - Number.parseInt(window.getComputedStyle(this.headerElement, null).getPropertyValue('padding-right'), 10);
    const calculatedWidth = {};
    this.columnLabelWidth = [];
    // calculate initial width;
    let totalPercentage = 0;
    for (let i = 0; i < this.headerElement.children.length - (this.showColumnSelector ? 1 : 0); i++) {
      calculatedWidth[this.displayedColumns[i]] = (this.headerElement.children[i].clientWidth / this.totalWidth) * 100;
      setTimeout(() => this.columnLabelWidth.push(this.headerElement.children[i].children[0].offsetWidth + 16));
      totalPercentage += calculatedWidth[this.displayedColumns[i]];
    }
    if (totalPercentage < 100) {
      const lastColumn = this.displayedColumns[this.displayedColumns.length - (this.showColumnSelector ? 2 : 1)];
      calculatedWidth[lastColumn] += 100 - totalPercentage;
    }
    this.initialized = true;
    // store calculated width values in userSettings. This will actually refresh the UI, that's why we did the calculation beforehand
    setTimeout(() => Object.keys(calculatedWidth).map(key => {
      this.userSettings[key] = this.userSettings[key] || {};
      this.userSettings[key].width = calculatedWidth[key];
    }));
  }

  getColumnWidth(column) {
    if (this.userSettings[column.name || column] === undefined || !this.userSettings[column.name || column].width) {
      return this.columnConfigByName[column.name || column].width || 100 /
      (this.displayedColumns.length - (this.showColumnSelector ? 1 : 0)) + '%';
    }
    return this.userSettings[column.name || column].width + '%';
  }

  setColumnWidth(column, width) {
    this.userSettings[column.name || column].width = width;
  }

  resizeColumn(event) {
    const width = this.headerElement.children[this.displayedColumns.indexOf(this.resizedColumn)].offsetWidth + event.clientX - this.lastX;
    const lastColumnWidth =
      this.headerElement.children[this.displayedColumns.indexOf(this.lastColumn)].offsetWidth - (event.clientX - this.lastX);
    // set the calculated width values only if both are bigger than the size of the column labels
    if (width > this.columnLabelWidth[this.displayedColumns.indexOf(this.resizedColumn)]
      && lastColumnWidth > this.columnLabelWidth[this.displayedColumns.indexOf(this.lastColumn)]
    ) {
      this.userSettings[this.resizedColumn.name || this.resizedColumn] =
        this.userSettings[this.resizedColumn.name || this.resizedColumn] || {};
      this.userSettings[this.resizedColumn.name || this.resizedColumn].width = (width / this.totalWidth) * 100;

      this.userSettings[this.lastColumn.name || this.lastColumn] = this.userSettings[this.lastColumn.name || this.lastColumn] || {};
      this.userSettings[this.lastColumn.name || this.lastColumn].width = (lastColumnWidth / this.totalWidth) * 100;
    }
    // if lastColumn reached the size of its label then switch to previous column
    if (lastColumnWidth <= this.columnLabelWidth[this.displayedColumns.indexOf(this.lastColumn)]
      && this.displayedColumns.indexOf(this.lastColumn) - 1 !== this.displayedColumns.indexOf(this.resizedColumn)) {
      this.lastColumn = this.displayedColumns[this.displayedColumns.indexOf(this.lastColumn) - 1];
    }
    // if lastColumn reached its original width then switch to next column
    if (lastColumnWidth >= this.columnOriginalWidth[this.displayedColumns.indexOf(this.lastColumn)]
      && this.displayedColumns.indexOf(this.lastColumn) + 1 !== this.displayedColumns.length - 1) {
      this.lastColumn = this.displayedColumns[this.displayedColumns.indexOf(this.lastColumn) + 1];
    }
    this.lastX = event.clientX;
  }

  startSizing(columnIndex, event) {
    this.headerElement = this.headerElement || this.elementRef.nativeElement.getElementsByTagName('mat-header-row')[0];
    this.resizedColumn = this.columns[columnIndex]['name'] || this.columns[columnIndex];
    this.lastColumn = this.displayedColumns[this.displayedColumns.length - (this.showColumnSelector ? 2 : 1)];
    this.columnOriginalWidth = [];
    for (let i = 0; i < this.headerElement.children.length; i++) {
      this.columnOriginalWidth.push(this.headerElement.children[i].clientWidth);
    }
    this.lastX = event.clientX;
    this.totalWidth = this.headerElement.clientWidth
     - Number.parseInt(window.getComputedStyle(this.headerElement, null).getPropertyValue('padding-left'), 10)
     - Number.parseInt(window.getComputedStyle(this.headerElement, null).getPropertyValue('padding-right'), 10);
    document.body.addEventListener('mousemove', this.resizeHandler, false);
    document.body.addEventListener('mouseup', this.stopResizeHandler, false);
  }

  stopSizing(event) {
    document.body.removeEventListener('mousemove', this.resizeHandler, false);
    document.body.removeEventListener('mouseup', this.stopResizeHandler, false);
    localStorage.setItem(this.configStorageKey, JSON.stringify(this.userSettings));
  }

  isLastColumn(column) {
    return this.displayedColumns.indexOf(column.name || column) + (this.showColumnSelector ? 2 : 1) === this.displayedColumns.length;
  }

  getItemCount() {
    return this.totalSize || (this.dataSource ? this.dataSource.length : 0);
  }

  createDataSource(data) {
    this.dataSource = new SmartTableDataSource(this.paginator, this.dataChange, this.sort, this.columnConfigChange, this.pageType);
    this.dataChange.next(data);
    this.columnConfigChange.next(this.columnConfigByName);
  }

  toggleColumn(column, event) {
    event.stopPropagation();
    if (!this.isLastDisplayed(column)) {
      this.userSettings[column.name || column] = this.userSettings[column.name || column] || {};
      this.userSettings[column.name || column].visible = this.displayedColumns.indexOf(column.name || column) < 0;

      // recalculate column width based on column visibility
      let totalPercentage = 0;
      Object.values(this.userSettings).map(col => {
        if (col['visible'] !== false) {
          totalPercentage += col['width'] || (100 / this.displayedColumns.length);
        }
      });
      Object.values(this.userSettings).map(col => {
        col['width'] = ((col['width'] || (100 / this.displayedColumns.length)) / totalPercentage) * 100;
      });

      localStorage.setItem(this.configStorageKey, JSON.stringify(this.userSettings));
      this.updateColumns();
      setTimeout(() => this.calculateColumnWidth());
    }
  }

  toggleMenu(event) {
    this.columnSelectorOpened = !this.columnSelectorOpened;
    if (this.columnSelectorOpened) {
      setTimeout(() => {
        document.body.addEventListener('click', this.closeHandler, false);
      }, 100);
    } else {
      document.body.removeEventListener('click', this.closeHandler, false);
    }
  }

  closeColumnSelector() {
    document.body.removeEventListener('click', this.closeHandler, false);
    this.columnSelectorOpened = false;
  }

  updateColumns() {
    this.displayedColumns = this.checkbox ? ['checkbox'] : [];
    this.selectableColumns = [];
    this.columns.map(column => {
      const config = new ColumnConfig(column);
      if (!config.statusColumn && (typeof column === 'string' || column.visible !== false)) {
        this.selectableColumns.push(column);
      }
      if (typeof column === 'string') {
        this.columnTemplates[column] = this.defaultCellTmpl;
        if (this.userSettings[column] === undefined || this.userSettings[column].visible !== false) {
          this.displayedColumns.push(column);
        }
        this.columnConfigByName[column] = new ColumnConfig({name: column});
      } else {
        this.columnTemplates[column.name] = column.template || this.defaultCellTmpl;
        if (config.visible && !config.actionColumn && !config.statusColumn && ((this.userSettings[column.name] === undefined
            && config.visibleByDefault) || (this.userSettings[column.name] && this.userSettings[column.name].visible === undefined
            && config.visibleByDefault) || (this.userSettings[column.name] && this.userSettings[column.name].visible))) {
          this.displayedColumns.push(column.name);
        }
        this.columnConfigByName[column.name] = config;
        if (config.actionColumn) {
          this.actionColumn = config;
        } else if (config.statusColumn) {
          this.statusColumn = config;
          if (this.checkbox) {
            this.displayedColumns.splice(1, 0, 'statusColumn');
          } else {
            this.displayedColumns.unshift('statusColumn');
          }
        }
      }
    });
    if (this.showColumnSelector) {
      this.displayedColumns.push('columnSelector');
    }
  }

  handleRow(row) {
    if (this.rowSelection) {
      if (this.selectedRow !== row) {
        this.selectedRow = row;
      } else {
        this.selectedRow = {};
      }
      this.rowActivated.emit(this.selectedRow);
    } else {
      this.rowActivated.emit(row);
    }
  }

  highlightRow(row) {
    this.rowHighlighted.emit(row);
  }

  isSelected(row) {
    return this.selectedRows.indexOf(row) > -1;
  }

  select(row: any): void {
    const index = this.selectedRows.indexOf(row);
    if (index > -1) {
      this.selectedRows.splice(index, 1);
    } else {
      this.selectedRows.push(row);
    }
    if (this.selectedRow === row) {
      this.selectedRow = {};
    } else {
      this.selectedRow = row;
    }
    this.rowsSelected.emit(this.selectedRows);
    this.rowActivated.emit(this.selectedRow);
  }

  isAllSelected() {
    return this.table._data.length > 0 && this.selectedRows.length === this.table._data.length;
  }

  isDisplayed(column) {
    return this.displayedColumns.indexOf(column.name || column) > -1;
  }

  isLastDisplayed(column) {
    const selectableDisplayedCount = this.displayedColumns.length - (this.showColumnSelector ? 1 : 0) - (this.checkbox ? 1 : 0);
    return this.isDisplayed(column)  && selectableDisplayedCount === 1;
  }

  selectAll() {
    if (this.selectAllCheckbox.checked) {
      this.selectedRows = [];
      this.table._data.map(item => {
        this.selectedRows.push(item);
      });
    } else {
      this.selectedRows = [];
    }
    this.rowsSelected.emit(this.selectedRows);
  }

  hash(str) {
    let hash = 5381,
        i    = str.length;

    while (i) {
      hash = (hash * 33) ^ str.charCodeAt(--i); // tslint:disable-line:no-bitwise
    }

    /* JavaScript does bitwise operations (like XOR, above) on 32-bit signed
     * integers. Since we want the results to be always positive, convert the
     * signed int to an unsigned by doing an unsigned bitshift. */
    return hash >>> 0; // tslint:disable-line:no-bitwise
  }

  setPage(page: number) {
    this.paginator.pageIndex = page;
  }
}
