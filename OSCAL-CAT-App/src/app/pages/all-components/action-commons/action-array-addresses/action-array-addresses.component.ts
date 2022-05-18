import { CommonModule } from '@angular/common';
import { Component, Input, OnInit, AfterViewInit } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, FormGroupDirective, Validators, FormControl } from '@angular/forms';
import { BooleanValueAccessor, ModalController, NavParams } from '@ionic/angular';
import { BrowserModule } from '@angular/platform-browser';

import { Address, Role } from './../../../../interfaces/oscal-types/oscal-catalog.types';
import { OscalCatalogEmpties } from '../../../../interfaces/oscal-types/oscal-catalog-factory';
import { LogManagerService } from './../../../../providers/logging/log-manager.service';

@Component({
  selector: 'oscal-address-list',
  templateUrl: './action-array-addresses.component.html',
  styleUrls: ['./action-array-addresses.component.scss'],
})
export class ArrayAddressesComponent implements OnInit, AfterViewInit {

  @Input() public localForm: FormGroup;
  @Input() public partyName: string;
  @Input() public entryName: string;
  @Input() public hideTitle: boolean;
  @Input() public addressParentName: string;
  @Input() public addressList: Array<Address>;
  @Input() public addressData: Address;
  @Input() public isArrayOptional?: string;
  @Input() public isSingleMode?: boolean;

  roleAddress: Address;
  roleInfo: Role;

  addressesGroup: FormGroup;

  addressFormList: FormArray;
  addressTo = '';
  addressTitle = '';
  streetAddress = '';
  toRemoveAddress = true;

  /*export interface Address {
    type?: string;
    postalAddress?: string[];
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
}*/

  constructor(
    private formBuilder: FormBuilder,
    public LMS: LogManagerService,
    public parentFormDirect: FormGroupDirective,
  ) {

  }

  ngOnInit() {
    // this.addressesGroup.setControl('addressArray', this.addressListFields);

    if (!this.addressList) {
      this.addressList = new Array<Address>();
      this.addressList.push(this.getEmptyAddress());
    }
    console.log(this.addressList);
    if (this.addressList && this.addressList.length > 0) {
      this.addressList.forEach((e, idx) => {
        console.log(`${idx}. A[${idx}] = ${e}`);
      });
    } else {
      console.log(`No Elements`);
    }

    this.addressFormList = this.formBuilder.array(this.initAddressList(this.addressList));
    this.addressesGroup = this.formBuilder.group({
      addressArray: this.addressFormList,
    });

  }

  ngAfterViewInit() {
    // this.addressesFields.setControl('addressArray', this.addressListFields);
  }

  initAddressList(list): Array<FormGroup> {
    const localList = list || new Array<Address>();
    const array = new Array<FormGroup>();
    console.log(`LocalList=${localList}`);
    localList.forEach(
      (addr: Address, index: number, arr: Array<Address>) => {
        console.log(`City:${addr.city}; Country: ${addr.country}`);
        const group = this.getAddressGroup(addr);
        array.push(group);
      }
    ); // end For-Each
    return array;
  }

  getAddressGroup(theAddress: Address = null): FormGroup {
    const addr = theAddress || this.getEmptyAddress();
    const addrTo: string = (!!addr && !!addr.addrLines && addr.addrLines.length >= 1) ? addr.addrLines[0] : '';
    const streetAddr = (!!addr && !!addr.addrLines && addr.addrLines.length >= 2) ? addr.addrLines[1] : '';
    const lines = (!!addr && !!addr.addrLines && addr.addrLines.length >= 3) ? addr.addrLines.slice(2) : new Array<string>();
    const addressParentName = this.addressParentName || 'Address Info';
    const group = this.formBuilder.group({
      type: [addr.type,
      Validators.compose([Validators.maxLength(180)]),
      ],
      addressTo: [addrTo,
        Validators.compose([Validators.maxLength(180)]),
      ],
      streetAddress: [streetAddr,
        Validators.compose([Validators.maxLength(180)]),
      ],
      city: [addr.city,
      Validators.compose([Validators.maxLength(180)]),
      ],
      state: [addr.state,
      Validators.compose([Validators.maxLength(180)]),
      ],
      postalCode: [addr.postalCode,
      Validators.compose([Validators.maxLength(180)]),
      ],
      country: [addr.country,
      Validators.compose([Validators.maxLength(180)]),
      ],
      extraLines: this.formBuilder.array(this.getLinesArray(lines)),
    });
    return group;
  }

  getLinesArray(lines: Array<string>): Array<FormGroup> {
    const controlArray = new Array<FormGroup>();
    lines.forEach((theLine: string, index: number) => {
      // groupObject['email_' + index.toString()] = [element, Validators.email];
      controlArray.push(this.formBuilder.group({ extraLine: [theLine, Validators.required] }));
      console.log(`Extra-Line #${index}: ${theLine}`);
    });
    return controlArray;
  }

  onAddExtraLine(addressIndex: number, itemIndex: number = -10) {
    // this.addressData.addrLines.push(theValue);
    // const topItems = this.addressFormList as FormArray; // Dig
    console.log(`A-Index:${addressIndex}; L-Index:${itemIndex};`);
    const currentAddress = this.addressFormList.at(addressIndex);
    const items = currentAddress.get('extraLines') as FormArray;
    // console.log(`Array Len: ${items.length}`);
    items.push(this.formBuilder.group({ extraLine: ['', Validators.required] }));
  }

  onRemoveExtraLine(addressIndex: number, itemIndex: number) {
    const currentAddress = this.addressFormList.at(addressIndex);
    const items = currentAddress.get('extraLines') as FormArray;
    items.removeAt(itemIndex); // Remove array element i
  }

  getListTitle(): string {
    const inputName = 'Address';
    const entityName = this.partyName;
    const parentEntity = this.entryName;
    const listTitle = 'Addresses';
    const formArray = this.addressesGroup.get('entries') as FormArray;
    const count = (this.addressesGroup.get('addressArray') as FormArray).length;
    const prefix = ((count > 0) ? '' : `No`); // `>>Name/Entity::${parentName}/${parentEntity}<<`
    const sufSuf = (count === 1) ? '' : 'es'; // Plural Suffix
    const suffix = ((count > 0) ? `[${count} ${inputName}${sufSuf}]` : '');
    const endingOpt = (!this.isArrayOptional) ? '' : this.isArrayOptional;
    const title = (!!entityName ?
      `${prefix} ${listTitle} for ${entityName} ${suffix} ${endingOpt}` :
      `${prefix} ${listTitle} for ${parentEntity} ${suffix} ${endingOpt}`);
    return title;
  }

  getAddressTitle(): string {
    const parentEntity = (this.partyName ? `for ${this.partyName}`
      : (this.entryName ? `for ${this.entryName}` : ''));
    return `Address ${parentEntity} `
  }

  hasExtraLines(addressIndex: number): boolean {
    const items = this.addressFormList.at(addressIndex).get('extraLines') as FormArray;
    return (items.length > 0);
  }

  onAddAddress() {
    const list: FormArray = this.addressesGroup.get('addressArray') as FormArray;
    list.controls.push(this.getAddressGroup());
  }

  onRemoveAddress(i: number) {
    const list: FormArray = this.addressesGroup.get('addressArray') as FormArray;
    list.controls.splice(i, 1); // Remove array element i
  }

  nameChanged() {
  }



  submitAddress() {

  }

  getEmptyAddress() {
    return OscalCatalogEmpties.getEmptyAddress();
  }

}
