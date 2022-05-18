import { AfterViewInit, Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormArray, FormBuilder, FormControl, FormGroup, FormGroupDirective, Validators } from '@angular/forms';
import { v4 as UUIDv4 } from 'uuid';

// import { DocumentIdentifier } from './../../../../interfaces/oscal-types/oscal-catalog.types';
import { OscalCatalogEmpties } from '../../../../interfaces/oscal-types/oscal-catalog-factory';

export interface FieldInfo {
  fieldToMap: string;
  labelName: string;
  inputTip?: string;
  validateAs?: Validators;
  requiredField?: undefined | null | boolean;
  complexInputType?: undefined | null | boolean;
  inputAs?: string;
  isPreset?: boolean;
}

@Component({
  selector: 'oscal-action-ancestor-base',
  templateUrl: './action-ancestor-base.component.html',
  styleUrls: ['./action-ancestor-base.component.scss'],
})
export class ActionAncestorBaseComponent implements OnInit {
  public label4Optional: string = ' (Optional)';

  @Input() ID: string;
  @Input() parentEntity: string;
  @Input() parentName: string;

  // For lone UI Purposes only
  @Input() public entityName: string;
  @Input() public actionName: string;   // 'Add' or 'Edit'
  @Input() public iconName: string;     // the name of the icon for Add/Edit button & Title


  @Input() listTitle: string;
  @Input() inputName: string;

  @Input() singleMode: boolean;
  @Input() hideTitle: boolean;
  @Input() showAddCancelButtons: boolean;
  @Input() hideAddElementButton: boolean;

  @Input() validateAs: Validators;
  @Input() isArrayOptional?: string;


  @Output() public closeTab: EventEmitter<any> = new EventEmitter();
  @Output() public saveTab: EventEmitter<any> = new EventEmitter();

  public inputsMap: Map<string, FieldInfo>;
  public localForm: FormGroup;
  public subForm: FormGroup;
  public subArray: FormArray;
  public emptyMaker: OscalCatalogEmpties;
  public defaultFormAnchor = 'entries';

  public defaultPluralTitle: string;
  public defaultSingleTitle: string;

  constructor(
    public formBuilder: FormBuilder,
    public parentFormDirect: FormGroupDirective) {

    this.inputsMap = new Map<string, FieldInfo>();
  }

  ngOnInit() {
    if (!this.ID) { // If the name for entry ID in not good, generate distinct one with UUIDv4
      this.ID = `id_${UUIDv4().replace('-', '_')}`;
    }
    this.localForm = this.parentFormDirect.form;

    // if (!this.inputName && this.defaultSingleTitle) {
    //   this.inputName = this.defaultSingleTitle;
    // } else if (!this.defaultSingleTitle) {
    //   this.defaultSingleTitle = 'Entry';
    // } else {
    //   this.inputName = 'Entry';
    // }
  }


  addFormGroup(theSubForm: FormArray | FormGroup): void {
    this.localForm.addControl(this.ID, theSubForm);
  }

  getEntityName(): string {
    return !!this.entityName ? this.entityName : 'Entity';
  }

  getFormTitle(): string {
    const elementTitle = (!!this.inputName) ? this.inputName : this.defaultSingleTitle;
    const formArray = this.subForm.get('entries') as FormArray;
    const count = formArray.length;
    if (count > 0) {
      console.log(`FormArray-Len = ${count} Elem=${elementTitle}`);
    }
    const prefix = ((count > 0) ? `` : `No`);
    const listTitle = (!this.listTitle && this.defaultPluralTitle) ?
      this.defaultPluralTitle :
      (this.listTitle) ? this.listTitle : 'entities';
    const countedForm = (count <= 1) ? elementTitle : listTitle; // Plural Suffix
    const ending = ((count >= 1 && !this.singleMode) ? `[${count} ${countedForm}]` : '');
    const title = (!!this.parentName ?
      `${prefix} ${listTitle} for ${this.parentName} ${ending}` :
      `${prefix} ${listTitle} for ${this.parentEntity} ${ending}`);

    return title.concat(' ', this.isArrayOptional || '');
  }

  getInputName(): string {
    return this.inputName || this.defaultSingleTitle;
  }

  getActionFormTitle(): string {
    const acting = this.actionName.startsWith('Edit') ? 'Editing' : 'Adding';
    return acting.concat(' ', this.listTitle);
  }

  getSaveButtonTitle(): string {
    return (!!this.listTitle) ? `Save ${this.listTitle}` : `Save Info`;
  }

  hasArrayEntries(): boolean {
    return this.arrayEntriesLength() > 0;
    // const currentEntries = this.subArray.get('entries') as FormArray;
    // return (currentEntries.length > 0);
  }

  arrayEntriesLength(): number {
    const currentEntries = this.subArray.get('entries') as FormArray;
    return currentEntries.length;
  }

  displayItemTitle(): boolean {
    return (!this.hideTitle && !this.singleMode);
  }

  onAssignUUID() {
    this.localForm.patchValue({ uuid: UUIDv4() });
  }

  getEmailValidator(): Validators {
    return Validators.email;
  }

  assignDefaultIfNeeded(targetVar: string, defaultValue: string) {
    if (!targetVar) {
      targetVar = defaultValue;
    }
  }

  getNewFormGroupByKey<Type>(data?: Type): FormGroup {
    const preparedGroup = {};
    for (const [key, value] of this.inputsMap) {
      console.log(`Key=${key}, Val=${value}`);
      preparedGroup[key] = new FormControl(
        (data ? data[key] : ''),
        (value.validateAs ? value.validateAs : [])
      );
    }
    return new FormGroup(preparedGroup);
  }

  // getGroupDataByKey<Type>(formGroup: FormGroup): Type {
  // }


  getNewFormGroupByFieldToMap<Type>(data?: Type): FormGroup {
    const preparedGroup = {};
    for (const [key, value] of this.inputsMap) {
      console.log(`Key=${key}, Val=${value}`);
      preparedGroup[value.fieldToMap] = new FormControl(
        {
          value: (data ? data[value.fieldToMap] : ''),
          disabled: value.isPreset,
        },
        (value.validateAs ? value.validateAs : [])
      );
    }
    return new FormGroup(preparedGroup);
  }

  /**
   * Assigns newly generated UUID to the field if it's properly referenced
   *
   * @param {number} an index of the FormGroup in the array of inputs
   * @param {string} the form anchor name. If empty, defaults to 'entries' or this.defaultFormAnchor value
   * @memberof ActionAncestorBaseComponent
   */
  onAssignArrayElementUUID(arrayIndex: number, formAnchor?: string) {
    const groupAnchor = ((!formAnchor) ? this.defaultFormAnchor : formAnchor);
    const formGroupData = (this.subForm.get(groupAnchor) as FormArray).at(arrayIndex) as FormGroup;
    formGroupData.patchValue({ uuid: UUIDv4() });
  }

  onAssignGroupElementUUID() {
    console.log(`Anchor=${this.defaultFormAnchor}\n subForm=${this.subForm.get('entries')}`);
    const formGroupData = (this.subForm.get('entries')) as FormGroup; // .get('entries')
    // const dataField = formGroupData.get('uuid') as FormControl;
    // console.log(`DF=${dataField.get('uuid')}`);
    const newUUID = UUIDv4();
    formGroupData.patchValue({ uuid: newUUID });
  }

  getUpdatedElementByFieldToMap<Type>(originalData: Type, arrayIndex: number = 0, formAnchor?: string): Type {
    // const updatedData: Type;
    // Get the anchor of the mapped array from the form
    const thisFormAnchor = !formAnchor ? this.defaultFormAnchor : formAnchor;
    // Get the form data location
    console.log(`Anchor=${thisFormAnchor}`);
    const formData = (this.subForm.get(thisFormAnchor) as FormArray).at(arrayIndex) as FormGroup;
    let nonEmptyCounter = 0;
    // Loop over the particular instance inputs map
    for (const [key, value] of this.inputsMap) {
      const oKey: keyof Type = value.fieldToMap as keyof Type;
      const theValue = formData.get(value.fieldToMap).value;
      if (!!theValue) {
        nonEmptyCounter++;
      }
      console.log(`oKey:${oKey}\t Form:${theValue}`);
      originalData[oKey] = theValue;
    }

    if (nonEmptyCounter > 0) {
      console.log(`Returning non-empty`);
      return originalData;
    } else {
      console.log(`!!!Nothing`);
      return undefined;
    }
  }

  getUpdatedElementByKey<Type>(originalData: Type, arrayIndex: number = 0, formAnchor?: string): Type {
    // const updatedData: Type;
    // Get the anchor of the mapped array from the form
    const thisFormAnchor = !formAnchor ? this.defaultFormAnchor : formAnchor;
    // Get the form data location
    const formData = (this.subForm.get(thisFormAnchor) as FormArray).at(arrayIndex) as FormGroup;
    let nonEmptyCounter = 0;
    // Loop over the particular instance inputs map
    for (const [key, value] of this.inputsMap) {
      const oKey: keyof Type = value.fieldToMap as keyof Type;
      const theValue = formData.get(key).value;
      console.log(`oKey:${oKey}\t Form:${theValue}`);
      if (!!theValue) {
        nonEmptyCounter++;
      }
      originalData[oKey] = theValue;
    }

    if (nonEmptyCounter > 0) {
      return originalData;
    } else {
      return undefined;
    }
  }

}