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

import {Component, Input, OnInit, ViewChild} from '@angular/core';
import * as _ from 'lodash';
import {WebsocketEventsService} from '../../services/websocket-events.service';
import {LoadingSpinner} from '../../services/loading-spinner.service';
import {BreadcrumbDataService} from '../../services/breadcrumb-data.service';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import {Commons} from '../../services/commons.service';

@Component({
  selector: 'des-monitor',
  templateUrl: './application-listing.component.html',
  styleUrls: ['./application-listing.component.scss', '../shared-components/common-table.scss']
})

export class ApplicationListingComponent implements OnInit {
  @ViewChild(MatSort, { static: true }) sort: MatSort;
  @ViewChild(MatPaginator, { static: true }) paginator: MatPaginator;

  public dataSource;
  public userData = [];
  public statusData = [];
  public pieChartData = [];
  public displayedColumns = ['status', 'applicationId', 'applicationName', 'applicationUser', 'queue', 'submitTime', 'finishTime'];
  public pieChartColor = Commons.colors;

  public statusIcons = {
    'FINISHED': 'fa-check-circle',
    'FAILED': 'fa-times-circle',
    'RUNNING': 'fa-spinner',
    'ACCEPTED': 'fa-spinner',
    'KILLED': 'fa-exclamation-circle',
    'succeeded': 'fa-play-circle',
    'null': 'fa-spinner'
  };

  constructor(private websocketEventsService: WebsocketEventsService,
              private breadcrumbDataService: BreadcrumbDataService) {
  }

  ngOnInit() {
    this.breadcrumbDataService.onChange(this.generateBreadcrumbs());
    LoadingSpinner.show();
    this.websocketEventsService.webSocketReady.subscribe((data: any) => {
      this.websocketEventsService.websocketEvents$.subscribe(
        (event: any) => {
          switch (event.type) {
            case 'APP_LIST':
              LoadingSpinner.hide();
              // eslint-disable-next-line @typescript-eslint/no-shadow
              const data = event.data;
              this.setupDataSource(data);
              this.setUserData(data);
              this.setStatusData(data);
              break;
          }
        }
      );
      this.websocketEventsService.sendNewEvent({'op': 'GET_APP_LIST'});
    });
  }

  generateBreadcrumbs() {
    return [
      {
        label: 'Applications',
        url: 'applications',
        params: ''
      }
    ];
  }

  applyFilter(filterValue: string) {
    this.dataSource.filter = filterValue.trim().toLowerCase();
  }

  private setUserData(appData) {
    this.userData = _.map(_.countBy(appData, data => data['applicationUser']), (val, key) => ({
      'name': key,
      'value': val
    }));
  }

  private setStatusData(appData) {
    this.statusData = _.map(_.countBy(appData, data => data['status']), (val, key) => ({
      'name': key,
      'value': val
    }));
  }

  private setupDataSource(data) {
    this.dataSource = new MatTableDataSource(data);
    this.dataSource.sort = this.sort;
    this.dataSource.paginator = this.paginator;
  }

}

