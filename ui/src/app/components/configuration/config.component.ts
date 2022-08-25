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

import {Component, OnInit} from '@angular/core';
import {ActivatedRoute} from '@angular/router';
import {BreadcrumbDataService} from '../../services/breadcrumb-data.service';
import {LoadingSpinner} from '../../services/loading-spinner.service';
import {WebsocketEventsService} from '../../services/websocket-events.service';
import * as _ from 'lodash';
import { MatTableDataSource } from '@angular/material/table';

@Component({
  selector: 'des-config',
  templateUrl: './config.component.html',
  styleUrls: ['./config.component.scss']
})
export class ConfigComponent implements OnInit {
  public appConfigData;
  public configData;
  public appId;
  public sqlPlanIds;
  private sqlPlanUpdates;

  constructor(private route: ActivatedRoute,
    private websocketEventsService: WebsocketEventsService,
    private breadcrumbDataService: BreadcrumbDataService) {
  }

  ngOnInit() {
    this.appId = this.route.snapshot.paramMap.get('appId');
    this.breadcrumbDataService.onChange(this.generateBreadcrumbs());
    LoadingSpinner.show();
    this.websocketEventsService.webSocketReady.subscribe(() => {
      this.websocketEventsService.websocketEvents$.subscribe(
        (event: any) => {
          switch (event.type) {
            case 'APP_CONFIG':
              LoadingSpinner.hide();
              this.appConfigData = event.data;
              this.populateConfigTableData();
              break;
            case 'SQL_PLAN_UPDATES':
              if (event.data) {
                this.sqlPlanUpdates = event.data;
                this.sqlPlanIds = Object.keys(this.sqlPlanUpdates);
              }
              LoadingSpinner.hide();
              break;
          }
        }
      );
      this.websocketEventsService.sendNewEvent({'op': 'GET_APP_CONFIG', 'data': {'appId': this.appId}});
      this.websocketEventsService.sendNewEvent({'op': 'GET_SQL_PLAN_UPDATES', 'data': {'appId': this.appId}});
    });
  }

  generateBreadcrumbs() {
    return [
      {
        label: 'Applications',
        url: 'applications',
        params: ''
      },
      {
        label: this.appId,
        url: 'application/' + this.appId,
        params: 'Config'
      }
    ];
  }

  applySearchFilter(configName: string, filterValue: string) {
    const dataSource = this.configData.find((ds) => ds.name === configName);
    dataSource.data.filter = filterValue.trim().toLowerCase();
  }

  populateConfigTableData() {
    const sortedKeys = Object.keys(this.appConfigData).sort((a, b) => {
      if (a > b) {
        return -1;
      }
      return 1;
    });
    this.configData = _.map(sortedKeys, (name) => {
      const tableData = _.map(this.appConfigData[name], (v, k) => ({name: k, value: v}));
      return {
        name: name,
        data: new MatTableDataSource(tableData)
      };
    });
  }
}
