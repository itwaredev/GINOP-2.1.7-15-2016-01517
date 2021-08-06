import { TemplateRef } from '@angular/core';

export enum SortOrder {
    ASCENDING = 'ASC',
    DESCENDING = 'DESC'
}

export interface FieldDescriptor {
    name: string;
    title?: string;
    sortable?: boolean;
    defaultSort?: SortOrder;
    cellTemplate?: TemplateRef<any>;
    formatter?: (data: any) => string;
}

export interface TableConfig {
    class?: string;
    style?: {[key: string]: string | number};
    head: {
        class?: string;
        style?: {[key: string]: string | number};
        sticky?: boolean; /* Experimental!! Not compatible with horizontal scrollbars! */
        hidden?: boolean;
        config: {
            fields: FieldDescriptor[];
            class?: string;
            style?: {[key: string]: string | number};
        }[];
    };
    body?: {
        class?: string;
        style?: {[key: string]: string | number};
        checkbox?: boolean;
    };
}

export interface BatchResult {
    totalSize: number;
    result: any[];
}
