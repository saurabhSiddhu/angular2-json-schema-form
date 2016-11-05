import { Component, Input, OnInit } from '@angular/core';
import { FormGroup } from '@angular/forms';

@Component({
  selector: 'fieldset-widget',
  template: `
    <fieldset [class]="options?.htmlClass" [disabled]="options?.readonly">
      <legend *ngIf="options?.title" [class]="options?.labelHtmlClass"
        [class.sr-only]="options?.notitle" [innerHTML]="options?.title"></legend>

      <div *ngFor="let item of layoutNode?.items; let i = index; trackBy: item?.dataPointer">
        <root-widget
          [layoutNode]="item"
          [formSettings]="formSettings"
          [dataIndex]="layoutNode?.type === 'array' ? dataIndex.concat(i) : dataIndex"
          [layoutIndex]="layoutIndex.concat(i)"></root-widget>
      </div>

    </fieldset>`,
})
export class FieldsetComponent implements OnInit {
  private options: any;
  @Input() layoutNode: any;
  @Input() formSettings: any;
  @Input() layoutIndex: number[];
  @Input() dataIndex: number[];

  ngOnInit() {
    this.options = this.layoutNode.options;
  }
}