import { Component, Input, OnInit, OnDestroy, ElementRef } from '@angular/core';
import { AbstractControl } from '@angular/forms';
import { Subscription } from 'rxjs/Subscription';
import 'rxjs/add/operator/distinctUntilChanged';
import * as _ from 'lodash';

import { JsonSchemaFormService } from '../json-schema-form.service';
import { isArray, capitalCase } from '../shared/validator.functions';

@Component({
  selector: 'input-widget',
  template: `
    <div [class]="options?.htmlClass || ''" [ngClass]="{'is-error': isConditionalRequired && isRequired && !controlValue}">
      <label *ngIf="options?.title"
        [attr.for]="'control' + layoutNode?._id"
        [class]="options?.labelHtmlClass || ''"
        [style.display]="options?.notitle ? 'none' : ''"
        [innerHTML]="options?.title"></label>
      <input *ngIf="boundControl"
        [formControl]="formControl"
        [attr.aria-describedby]="'control' + layoutNode?._id + 'Status'"
        [attr.list]="'control' + layoutNode?._id + 'Autocomplete'"
        [attr.maxlength]="options?.maxLength"
        [attr.minlength]="options?.minLength"
        [attr.pattern]="options?.pattern"
        [attr.placeholder]="options?.placeholder"
        [attr.required]= "isRequired"
        [class]="options?.fieldHtmlClass || ''"
        [id]="'control' + layoutNode?._id"
        [name]="controlName"
        [readonly]="options?.readonly ? 'readonly' : null"
        [type]="layoutNode?.type">
      <input *ngIf="!boundControl"
        [attr.aria-describedby]="'control' + layoutNode?._id + 'Status'"
        [attr.list]="'control' + layoutNode?._id + 'Autocomplete'"
        [attr.maxlength]="options?.maxLength"
        [attr.minlength]="options?.minLength"
        [attr.pattern]="options?.pattern"
        [attr.placeholder]="options?.placeholder"
        [attr.required]= "isRequired"
        [class]="options?.fieldHtmlClass || ''"
        [disabled]="controlDisabled"
        [id]="'control' + layoutNode?._id"
        [name]="controlName"
        [readonly]="options?.readonly ? 'readonly' : null"
        [type]="layoutNode?.type"
        [value]="controlValue"
        (input)="updateValue($event)">
        <datalist *ngIf="options?.typeahead?.source"
          [id]="'control' + layoutNode?._id + 'Autocomplete'">
          <option *ngFor="let word of options?.typeahead?.source" [value]="word">
        </datalist>
        <span *ngIf="isConditionalRequired && isRequired && !controlValue" class="info-3 text-danger">
          {{options?.validationMessages?.required}}
        </span>
    </div>`,
})
export class InputComponent implements OnInit, OnDestroy {
  formControl: AbstractControl;
  controlName: string;
  controlValue: string;
  boundControl = false;
  isRequired: boolean;
  isConditionalRequired: boolean = false;
  options: any;
  autoCompleteList: string[] = [];
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
    this.jsf.initializeControl(this);
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
