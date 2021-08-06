import { Component, OnInit, Input, OnChanges, SimpleChanges, ViewChild, Output, EventEmitter } from '@angular/core';
import { Observable } from 'rxjs';
import { SortOrder, TableConfig, BatchResult } from './table-model';
import { first } from 'rxjs/operators';
import { CdkVirtualScrollViewport } from '@angular/cdk/scrolling';

@Component({
  selector: 'app-page-scroll-table',
  templateUrl: './page-scroll-table.component.html',
  styleUrls: ['./page-scroll-table.component.scss'],
})
export class PageScrollTableComponent implements OnInit, OnChanges {
  @ViewChild(CdkVirtualScrollViewport) private _viewport: CdkVirtualScrollViewport;
  @Input() pageSize ? = 50;
  @Input() tableConfig: TableConfig;
  @Input() content?: any[] = [];
  @Input() supplier?: (page: number, pageSize: number, sort: string, sortOrder: SortOrder) => Observable<BatchResult>;
  @Output() readonly itemSelected = new EventEmitter<any>();
  @Output() readonly itemChecked = new EventEmitter<{item: any, checked: boolean}>();

  private _page = 0;
  private _loading = false;
  private readonly _sorting = {field: null, order: SortOrder.DESCENDING};
  private totalSize = 0;
  private _itemSize: number = null;
  private _selectedItem: any = null;

  public readonly checkedItems = [];

  constructor() { }

  public get loading(): boolean {
    return this._loading;
  }
  public get itemSize(): number {
    return this._itemSize;
  }

  ngOnInit() {}

  ngOnChanges(changes: SimpleChanges) {
    if (changes['tableConfig'] && ((this.tableConfig.body || {}).style || {})['height']) {
      this._itemSize = parseFloat(this.tableConfig.body.style['height'].toString());
    }
    if (changes['supplier'] && changes['supplier'].previousValue) {
      this.reset();
    }
    if (changes['content'] && !this.supplier) {
      this.totalSize = this.content.length;
    }
  }

  onScroll(): void {
    if (this._viewport.getRenderedRange().end >= this.content.length && this.content.length < this.totalSize && !this.loading) {
      this.next();
    }
  }

  onSortChange(field: string): void {
    if (this._sorting.field === field && this._sorting.order === SortOrder.ASCENDING) {
      this._sorting.order = SortOrder.DESCENDING;
    } else {
      this._sorting.field = field;
      this._sorting.order = SortOrder.ASCENDING;
    }
    if (this.supplier) {
      this.content.length = 0;
      this._page = 0;
      this.next();
    }
  }

  onItemSelect(item: any): void {
    if (this._selectedItem === item) {
      this._selectedItem = null;
    } else {
      this._selectedItem = item;
    }
    this.itemSelected.emit(this._selectedItem);
  }

  onItemCheck(item: any): void {
    let idx = null;
    if ((idx = this.checkedItems.indexOf(item)) > -1) {
      this.checkedItems.splice(idx, 1);
    } else {
      this.checkedItems.push(item);
    }
    this.itemChecked.emit({item, checked: idx < 0});
  }

  next(): void {
    if (this.supplier) {
      this._loading = true;
      this.supplier(this._page++, this.pageSize, this._sorting.field, this._sorting.order)
      .pipe(first())
      .subscribe(batch => {
        this.totalSize = batch.totalSize;
        this.content = this.content.concat(batch.result);
        this._loading = false;
      });
    }
  }

  reset(dataOnly?: boolean): void {
    this.content.length = 0;
    this.checkedItems.length = 0;
    this._page = 0;
    this._viewport.scrollToIndex(0);
    if (!dataOnly) {
      this.totalSize = 0;
      this._sorting.field = null;
      this._sorting.order = SortOrder.DESCENDING;
    }
  }
}
