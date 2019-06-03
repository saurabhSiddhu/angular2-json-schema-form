import { Component, Input, OnInit, OnDestroy, ElementRef } from '@angular/core';
import { AbstractControl } from '@angular/forms';
import { Subscription } from 'rxjs/Subscription';
import 'rxjs/add/operator/distinctUntilChanged';
import * as _ from 'lodash';

import { JsonSchemaFormService } from '../json-schema-form.service';
import { isArray } from './../shared/validator.functions';
import { capitalCase } from './../shared/validator.functions';

@Component({
  selector: 'textarea-widget',
  template: `
    <div
      [class]="options?.htmlClass || ''"  [ngClass]="{'is-error': isConditionalRequired && isRequired && !controlValue}">
      <label *ngIf="options?.title"
        [attr.for]="'control' + layoutNode?._id"
        [class]="options?.labelHtmlClass || ''"
        [style.display]="options?.notitle ? 'none' : ''"
        [innerHTML]="options?.title"></label>
      <textarea *ngIf="boundControl"
        [formControl]="formControl"
        [attr.aria-describedby]="'control' + layoutNode?._id + 'Status'"
        [attr.maxlength]="options?.maxLength"
        [attr.minlength]="options?.minLength"
        [attr.pattern]="options?.pattern"
        [attr.placeholder]="options?.placeholder"
        [attr.readonly]="options?.readonly ? 'readonly' : null"
        [attr.required]= "isRequired"
        [class]="options?.fieldHtmlClass || ''"
        [id]="'control' + layoutNode?._id"
        [name]="controlName"></textarea>
      <textarea *ngIf="!boundControl"
        [attr.aria-describedby]="'control' + layoutNode?._id + 'Status'"
        [attr.maxlength]="options?.maxLength"
        [attr.minlength]="options?.minLength"
        [attr.pattern]="options?.pattern"
        [attr.placeholder]="options?.placeholder"
        [attr.readonly]="options?.readonly ? 'readonly' : null"
        [attr.required]= "isRequired"
        [class]="options?.fieldHtmlClass || ''"
        [disabled]="controlDisabled"
        [id]="'control' + layoutNode?._id"
        [name]="controlName"
        [value]="controlValue"
        (input)="updateValue($event)">{{controlValue}}</textarea>
        <span *ngIf="isConditionalRequired && isRequired && !controlValue" class="info-3 text-danger">
          {{options?.validationMessages?.required}}
        </span>
    </div>`,
})
export class TextareaComponent implements OnInit, OnDestroy {
  formControl: AbstractControl;
  controlName: string;
  controlValue: any;
  isRequired: boolean;
  isConditionalRequired: boolean = false;
  boundControl = false;
  options: any;
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
    this.jsf.initializeControl(this);
    this.isRequired = this.options.required;

    if (isArray(this.options.formBehaviourConditions) && this.options.formBehaviourConditions.length > 0) {
      this.dataChanges$ =
        this.jsf.dataChanges.distinctUntilChanged((current, prev) => _.isEqual(current, prev))
          .subscribe(() => { this.handleBehaviourChanges(); });
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
