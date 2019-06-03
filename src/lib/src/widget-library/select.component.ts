import { Component, Input, OnInit, OnDestroy, ElementRef } from '@angular/core';
import { AbstractControl } from '@angular/forms';
import { Subscription } from 'rxjs/Subscription';
import 'rxjs/add/operator/distinctUntilChanged';
import * as _ from 'lodash';

import { JsonSchemaFormService } from '../json-schema-form.service';
import { buildTitleMap } from '../shared';
import {  isArray, capitalCase } from '../shared/validator.functions';

@Component({
  selector: 'select-widget',
  template: `
    <div
      [class]="options?.htmlClass || ''"
      [ngClass]="{'is-error': isConditionalRequired && isRequired && !controlValue}"
      >
      <label *ngIf="options?.title"
        [attr.for]="'control' + layoutNode?._id"
        [class]="options?.labelHtmlClass || ''"
        [style.display]="options?.notitle ? 'none' : ''"
        [innerHTML]="options?.title"></label>
      <select *ngIf="boundControl"
        [formControl]="formControl"
        [attr.aria-describedby]="'control' + layoutNode?._id + 'Status'"
        [attr.readonly]="options?.readonly ? 'readonly' : null"
        [attr.required]="isRequired"
        [class]="options?.fieldHtmlClass || ''"
        [id]="'control' + layoutNode?._id"
        [name]="controlName">
        <ng-template ngFor let-selectItem [ngForOf]="selectList">
          <option *ngIf="!isArray(selectItem?.items)"
            [ngValue]="selectItem?.value">
            <span [innerHTML]="selectItem?.name"></span>
          </option>
          <optgroup *ngIf="isArray(selectItem?.items)"
            [label]="selectItem?.group">
            <option *ngFor="let subItem of selectItem.items"
              [ngValue]="subItem?.value">
              <span [innerHTML]="subItem?.name"></span>
            </option>
          </optgroup>
        </ng-template>
      </select>
      <select *ngIf="!boundControl"
        [attr.aria-describedby]="'control' + layoutNode?._id + 'Status'"
        [attr.readonly]="options?.readonly ? 'readonly' : null"
        [attr.required]="isRequired"
        [class]="options?.fieldHtmlClass || ''"
        [disabled]="controlDisabled"
        [id]="'control' + layoutNode?._id"
        [name]="controlName"
        (change)="updateValue($event)">
        <ng-template ngFor let-selectItem [ngForOf]="selectList">
          <option *ngIf="!isArray(selectItem?.items)"
            [selected]="selectItem?.value === controlValue"
            [ngValue]="selectItem?.value">
            <span [innerHTML]="selectItem?.name"></span>
          </option>
          <optgroup *ngIf="isArray(selectItem?.items)"
            [label]="selectItem?.group">
            <option *ngFor="let subItem of selectItem.items"
              [attr.selected]="subItem?.value === controlValue"
              [ngValue]="subItem?.value">
              <span [innerHTML]="subItem?.name"></span>
            </option>
          </optgroup>
        </ng-template>
      </select>
      <span *ngIf="isConditionalRequired && isRequired && !controlValue" class="info-3 text-danger">
          {{options?.validationMessages?.required}}
        </span>
    </div>`,
})
export class SelectComponent implements OnInit, OnDestroy {
  formControl: AbstractControl;
  controlName: string;
  controlValue: any;
  boundControl = false;
  isRequired: boolean;
  isConditionalRequired: boolean = false;
  options: any;
  selectList: any[] = [];
  isArray = isArray;
  @Input() layoutNode: any;
  @Input() layoutIndex: number[];
  @Input() dataIndex: number[];

  private dataChanges$: Subscription;

  constructor(
    private jsf: JsonSchemaFormService,
    private element: ElementRef
  ) { }

  ngOnInit() {
    this.options = this.layoutNode.options || {};
    this.isRequired = this.options.required;
    this.selectList = buildTitleMap(
      this.options.titleMap || this.options.enumNames,
      this.options.enum, !!this.options.required, !!this.options.flatList
    );
    this.jsf.initializeControl(this);
    if (isArray(this.options.formBehaviourConditions) && this.options.formBehaviourConditions.length > 0) {
      this.dataChanges$ =
        this.jsf.dataChanges.distinctUntilChanged((current, prev) => _.isEqual(current, prev))
          .subscribe((values) => { this.handleBehaviourChanges(); });

      // Ugly hack to disable field after rendering.
      // TODO: Try to do this is in buildFormGroupTemplate.
      setTimeout(() => { this.handleBehaviourChanges(); });
      this.isConditionalRequired = !!this.options.formBehaviourConditions
      .find((option) => { return option.type === 'required' });
    }
  }

  ngOnDestroy() {
    if (this.dataChanges$) {
      this.dataChanges$.unsubscribe();
    }
  }

  updateValue(event) {
    this.jsf.updateValue(this, event.target.value);
  }
  handleBehaviourChanges() {
    this.options.formBehaviourConditions.forEach(condition => {
      this['handle' + capitalCase(condition.type)](condition.functionBody)
    });
  }
  handleDisable(fn: string): void {
    if (this.jsf.evaluateFunctionBody(fn, this.dataIndex)) {
      this.formControl.disable();
    } else {
      this.formControl.enable();
    }
  }
  handleRequired(fn: string): void {
    this.isRequired = this.jsf.evaluateFunctionBody(fn, this.dataIndex) ? false : true;
    if (this.isRequired) {
      this.element.nativeElement.closest('.form-group').classList.add('isRequired');
    } else {
      this.element.nativeElement.closest('.form-group').classList.remove('isRequired');
    }
 }

  handleValue(fn: string): void {
    if (this.jsf.evaluateFunctionBody(fn, this.dataIndex)) {
      this.jsf.updateValue(this, null);
    }
  }
}
