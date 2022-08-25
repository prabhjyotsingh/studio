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

import {Component, OnInit, EventEmitter, Output} from '@angular/core';
import {LoadingSpinner} from '../../services/loading-spinner.service';
import {NavigationEnd, Router} from '@angular/router';
import {ParentChildMessagingService} from '../../services/parent-child-messaging.service';

@Component({
  selector: 'des-sidenav',
  templateUrl: './sidenav.component.html',
  styleUrls: ['./sidenav.component.scss']
})
export class SidenavComponent implements OnInit {
  @Output() toggleSideNav = new EventEmitter();

  public selectedNav = 'monitor';
  public appId: string;

  constructor(router: Router, private parentChildMessagingService: ParentChildMessagingService) {
    router.events.forEach((event) => {
      if (event instanceof NavigationEnd) {
        if (event.url.indexOf('/notebook') === 0) {
          this.selectedNav = 'notebook';
        } else if (event.url.indexOf('/application/') === 0 ||
          event.url.indexOf('/config/') === 0 || event.url.indexOf('/sql-view') === 0) {
          this.selectedNav = 'analyze';
          this.appId = event.url.split('/')[2];
        } else if (event.url.indexOf('/config') === 0) {
          this.selectedNav = 'config';
        } else {
          this.selectedNav = 'monitor';
        }
      }
    });
  }

  ngOnInit() {
    LoadingSpinner.hide();
  }

  public reloadFrame() {
    if (this.selectedNav === 'notebook') {
      document.querySelector('iframe').contentWindow.history.back();
    }
  }

  public toggleAction() {
    let callBackFun;
    if (this.selectedNav !== 'monitor') {
      callBackFun = () => this.parentChildMessagingService.publish('sidebar-toggle', {});
    }
    this.toggleSideNav.emit(callBackFun);
  }
}
