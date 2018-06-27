import {Inject, Injectable} from '@angular/core';
import jQuery from "jquery";
import {DOCUMENT} from "@angular/common";


@Injectable({
  providedIn: 'root'
})
export class PreLoaderService {
  document: any;

  constructor(@Inject(DOCUMENT) document) {
    this.document = document;
  }

  static hidePreLoader() {
    document.getElementById('pre-loader');
    jQuery('#pre-loader').fadeOut();
  }
}
