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

import {Component, Input, OnChanges, OnInit, SimpleChanges} from '@angular/core';

@Component({
  selector: 'des-app-info',
  templateUrl: './app-info.component.html',
  styleUrls: ['./app-info.component.scss', '../shared-components/common-table.scss']
})
export class AppInfoComponent implements OnInit, OnChanges {

  @Input() appServiceData;
  public user: string;
  public appName: string;
  public startTime: string;
  public endTime: string;
  public finalStatus: string;

  public statusIcons = {
    'FINISHED': 'fa-check-circle',
    'FAILED': 'fa-times-circle',
    'RUNNING': 'fa-spinner',
    'ACCEPTED': 'fa-spinner',
    'KILLED': 'fa-exclamation-circle',
    'succeeded': 'fa-play-circle',
    'null': 'fa-spinner'
  };

  constructor() {
  }

  ngOnInit() {

  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['appServiceData'] && this.appServiceData) {
      this.user = this.appServiceData.user;
      this.appName = this.appServiceData.applicationName;
      this.startTime = this.appServiceData.applicationStartTime;
      this.endTime = this.appServiceData.applicationEndTime;
      this.finalStatus = this.appServiceData.finalApplicationStatus;
      if (this.appServiceData.finalApplicationStatus === undefined) {
        this.finalStatus = 'RUNNING';
      }
    }
  }

}
