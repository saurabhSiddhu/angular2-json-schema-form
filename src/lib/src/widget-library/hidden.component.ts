import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { AbstractControl } from '@angular/forms';
import { Subscription } from 'rxjs/Subscription';
import 'rxjs/add/operator/distinctUntilChanged';
import * as _ from 'lodash';

import { JsonSchemaFormService } from '../json-schema-form.service';

@Component({
  selector: 'hidden-widget',
  template: `
    <input *ngIf="boundControl"
      [formControl]="formControl"
      [id]="'control' + layoutNode?._id"
      [name]="controlName"
      type="hidden">
    <input *ngIf="!boundControl"
      [disabled]="controlDisabled"
      [name]="controlName"
      [id]="'control' + layoutNode?._id"
      type="hidden"
      [value]="controlValue">`,
})
export class HiddenComponent implements OnInit, OnDestroy {
  formControl: AbstractControl;
  controlName: string;
  controlValue: any;
  boundControl = false;
  @Input() layoutNode: any;
  @Input() layoutIndex: number[];
  @Input() dataIndex: number[];

  private dataChanges$: Subscription;

  constructor(
    private jsf: JsonSchemaFormService
  ) { }

  ngOnInit() {
    this.jsf.initializeControl(this);

    this.dataChanges$ =
      this.jsf.dataChanges.distinctUntilChanged((current, prev) => _.isEqual(current, prev))
        .subscribe((values) => {
          if (this.controlDisabled) {
            this.formControl.disable();
          } else {
            this.formControl.enable();
          }
        });
  }

  ngOnDestroy() {
    this.dataChanges$.unsubscribe();
  }

  get controlDisabled(): boolean {
    return this.jsf.evaluateDisabled(this.layoutNode, this.dataIndex);
  }
}
