/*
 *
 *  CLOUDERA DATAPLANE SERVICE AND ITS CONSTITUENT SERVICES
 *
 *  (c) 2016-2018 Cloudera, Inc. All rights reserved.
 *
 *  This code is provided to you pursuant to your written agreement with Cloudera, which may be the terms of the
 *  Affero General Public License version 3 (AGPLv3), or pursuant to a written agreement with a third party authorized
 *  to distribute this code.  If you do not have a written agreement with Cloudera or with an authorized and
 *  properly licensed third party, you do not have any rights to this code.
 *
 *  If this code is provided to you under the terms of the AGPLv3:
 *  (A) CLOUDERA PROVIDES THIS CODE TO YOU WITHOUT WARRANTIES OF ANY KIND;
 *  (B) CLOUDERA DISCLAIMS ANY AND ALL EXPRESS AND IMPLIED WARRANTIES WITH RESPECT TO THIS CODE, INCLUDING BUT NOT
 *    LIMITED TO IMPLIED WARRANTIES OF TITLE, NON-INFRINGEMENT, MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE;
 *  (C) CLOUDERA IS NOT LIABLE TO YOU, AND WILL NOT DEFEND, INDEMNIFY, OR HOLD YOU HARMLESS FOR ANY CLAIMS ARISING
 *    FROM OR RELATED TO THE CODE; AND
 *  (D) WITH RESPECT TO YOUR EXERCISE OF ANY RIGHTS GRANTED TO YOU FOR THE CODE, CLOUDERA IS NOT LIABLE FOR ANY
 *    DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, PUNITIVE OR CONSEQUENTIAL DAMAGES INCLUDING, BUT NOT LIMITED TO,
 *    DAMAGES RELATED TO LOST REVENUE, LOST PROFITS, LOSS OF INCOME, LOSS OF BUSINESS ADVANTAGE OR UNAVAILABILITY,
 *    OR LOSS OR CORRUPTION OF DATA.
 *
 */

import {Component, HostListener, OnInit, Pipe, PipeTransform} from '@angular/core';
import {DomSanitizer} from '@angular/platform-browser';
import {AppService} from './app.service';
import {Subject} from 'rxjs';
import {debounceTime} from 'rxjs/operators';

@Pipe({name: 'safe'})
export class SafePipe implements PipeTransform {
  constructor(private sanitizer: DomSanitizer) {
  }

  transform(url) {
    return this.sanitizer.bypassSecurityTrustResourceUrl(url);
  }
}

@Component({
  selector: 'des-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {

  public isCollapsed: boolean = JSON.parse(localStorage.getItem('sidebar-collapsed')) || false;
  public sideNavMode = 'over';

  public width = window.screen.width;

  private resizeSubject = new Subject<number>();
  private resizeObservable = this.resizeSubject.asObservable().pipe(debounceTime(500));

  // do not remove AppService, it's kept for authentication propose.
  constructor(appService: AppService) {
  }

  @HostListener('window:resize', ['$event.target.innerWidth'])
  onResize(width: number) {
    this.width = width;
    this.resizeSubject.next(width);
  }

  ngOnInit() {
    this.setSideNavMode();
    this.resizeObservable.subscribe(() => {
      this.setSideNavMode();
    });
  }

  setSideNavMode() {
    if (this.width < 1025) {
      this.sideNavMode = 'over';
    } else {
      this.sideNavMode = 'side';
    }
  }

  toggleSideNavigation(func) {
    this.isCollapsed = !this.isCollapsed;
    localStorage.setItem('sidebar-collapsed', this.isCollapsed.toString());
    if (func !== undefined) {
      setTimeout(() => {
        func();
      }, 0);
    }
  }
}