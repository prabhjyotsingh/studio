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

import {Component, OnInit, ViewChild, ViewEncapsulation} from '@angular/core';
import {BreadcrumbDataService} from '../../services/breadcrumb-data.service';
import {ActivatedRoute} from '@angular/router';
import {LoadingSpinner} from '../../services/loading-spinner.service';
import {WebsocketEventsService} from '../../services/websocket-events.service';

@Component({
  selector: 'des-sql-view',
  templateUrl: './sql-view.component.html',
  styleUrls: ['./sql-view.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class SqlViewComponent implements OnInit {
  @ViewChild('sqlPlan', { static: true }) sqlPlanComponent;

  public appId: string | null;
  public planId: string | null;
  public sqlPlanUpdates: any;
  public sqlPlanIds;

  constructor(private activatedRoute: ActivatedRoute,
              private websocketEventsService: WebsocketEventsService,
              private breadcrumbDataService: BreadcrumbDataService) {
    activatedRoute.params.subscribe(val => {
      this.init();
    });
  }

  init() {
    this.appId = this.activatedRoute.snapshot.paramMap.get('appId');
    this.planId = this.activatedRoute.snapshot.paramMap.get('planId');
    this.breadcrumbDataService.onChange(this.generateBreadcrumbs());
    LoadingSpinner.show();
    this.websocketEventsService.webSocketReady.subscribe(() => {
      this.websocketEventsService.websocketEvents$.subscribe(
        (event: any) => {
          switch (event.type) {
            case 'SQL_PLAN_UPDATES':
              this.sqlPlanUpdates = event.data;
              this.sqlPlanIds = Object.keys(this.sqlPlanUpdates);
              setTimeout(() => this.sqlPlanComponent.renderPlan(this.planId), 1);
              LoadingSpinner.hide();
              break;
          }
        }
      );

      this.websocketEventsService.sendNewEvent(
        {
          'op': 'GET_SQL_PLAN_UPDATES', 'data': {
            'appId': this.appId
          }
        }
      );
    });
  }

  ngOnInit() {
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
        params: ' SQL plan: ' + this.planId
      }
    ];
  }

}
