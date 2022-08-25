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

import {Component, HostListener, OnInit, ViewEncapsulation, ViewChild} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import {Subject} from 'rxjs';
import {debounceTime} from 'rxjs/operators';
import {LoadingSpinner} from '../../services/loading-spinner.service';
import {ParentChildMessagingService} from '../../services/parent-child-messaging.service';
import {WebsocketEventsService} from '../../services/websocket-events.service';
import {BreadcrumbDataService} from '../../services/breadcrumb-data.service';

import _ from 'lodash';
import {Commons} from '../../services/commons.service';

declare let window: any;

@Component({
  selector: 'des-job-analysis',
  templateUrl: './job-analysis.component.html',
  styleUrls: ['./job-analysis.component.scss', '../shared-components/common-table.scss'],
  encapsulation: ViewEncapsulation.None
})

export class JobAnalysisComponent implements OnInit {
  @ViewChild('tabView', { static: true }) tabView;
  public selectedStage = {};
  public tableData: Array<TableDataType> = [];
  public svgApiMap = {};
  public colors = Commons.colors;
  public partitionLineChartData = [];
  public width = 0;
  public activeTab;
  public tab;
  public flameCardSetting: any = [];
  public sqlPlanUpdates;

  private appId;
  private stageName;
  private stageId;
  private partitionMetric = [
    'timePerTask',
    'sizePerPartition',
    'keyPerPartition'
  ];

  private ioDetailsArray = [];
  private resizeSubject = new Subject<number>();
  private resizeObservable = this.resizeSubject.asObservable().pipe(debounceTime(500));

  constructor(private route: ActivatedRoute,
    private websocketEventsService: WebsocketEventsService,
    private parentChildMessagingService: ParentChildMessagingService,
    private router: Router,
    private breadcrumbDataService: BreadcrumbDataService) {
  }

  @HostListener('window:resize', ['$event.target.innerWidth'])
  onResize(width: number) {
    this.resizeSubject.next(width);
  }

  ngOnInit() {
    const params = this.route.snapshot.paramMap;
    this.appId = params.get('appId');
    this.stageId = params.get('stageId');
    this.stageName = 'stage_' + this.stageId + ':0';
    this.tab = this.route.snapshot.queryParamMap.get('tab');

    this.breadcrumbDataService.onChange(this.generateBreadcrumbs());

    LoadingSpinner.show();
    this.websocketEventsService.webSocketReady.subscribe(() => {
      this.websocketEventsService.websocketEvents$.subscribe(
        (event: any) => {
          switch (event.type) {
            case 'STAGE_DETAILS':
              LoadingSpinner.hide();
              this.selectedStage = event.data;
              this.selectedStage['stage'] = this.selectedStage['stageId'];
              this.svgApiMap = {
                'main': {
                  'appId': this.appId,
                  'stageName': this.stageName,
                  'stageId': this.stageId
                }
              };
              this.flameCardSetting = [{
                taskId: 'main',
                klass: 'mdl-cell--12-col'
              }];
              this.activeTab = !!this.tab ? Number(this.tab) : 0;
              break;
            case 'STAGE_ANOMALIES':
              this.populateTabelData(event.data);
              break;
            case 'SQL_PLAN_UPDATES':
              this.sqlPlanUpdates = event.data;
              break;
            case 'PARTITION_DATA':
              this.ioDetailsArray = event.data;
              break;
          }
          this.getLineChartData();
        }
      );
      this.websocketEventsService.sendNewEvent(
        {
          'op': 'GET_STAGE_DETAILS', 'data': {
            'appId': this.appId,
            'stageName': this.stageName
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
      this.websocketEventsService.sendNewEvent(
        {
          'op': 'GET_STAGE_ANOMALIES', 'data': {
            'appId': this.appId,
            'stageName': this.stageName
          }
        }
      );
      this.websocketEventsService.sendNewEvent(
        {
          'op': 'GET_PARTITION_DATA', 'data': {
            'appId': this.appId,
            'stageName': this.stageName
          }
        }
      );
    });

    this.resizeObservable.subscribe(() => {
      this.setTabViewWidth();
      this.getLineChartData();
    });

    this.parentChildMessagingService.on('sidebar-toggle').subscribe((options: any) => {
      this.setTabViewWidth();
      this.getLineChartData();
    });
    this.setTabViewWidth();
  }

  setTabViewWidth() {
    this.width = this.tabView.nativeElement.clientWidth;
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
        params: 'Stage: ' + this.stageId
      }
    ];
  }

  public checkBoxClicked(obj: any) {
    const index = _.findIndex(this.tableData, (t) => t === obj); const that = this;
    if (index !== -1) {
      this.tableData[index].show = !this.tableData[index].show;
    }
    if (this.tableData[index].show) {
      this.svgApiMap[this.tableData[index]['taskId']] = {
        'appId': this.appId,
        'stageName': this.stageName,
        'taskId': this.tableData[index]['taskId'],
        'stageId': this.stageId
      };
      this.flameCardSetting.push({
        'taskId': this.tableData[index]['taskId'],
        'klass': 'mdl-cell--12-col'
      });
    } else {
      delete this.svgApiMap[this.tableData[index]['taskId']];
      _.remove(this.flameCardSetting, n => n.taskId === that.tableData[index]['taskId']);
    }
  }

  selectedTabChangeHandler(event) {
    this.activeTab = event.index;
  }

  onFlameChartCardWidthChange(event) {
    const index = event.target.getAttribute('id');
    this.flameCardSetting[index]['klass'] = event.target.value;
  }

  private populateTabelData(data) {
    this.tableData = [];
    // eslint-disable-next-line @typescript-eslint/prefer-for-of
    for (let j = 0; j < data.length; j++) {
      // eslint-disable-next-line @typescript-eslint/prefer-for-of
      for (let i = 0; i < data[j].anomalousTaskDetails.length; i++) {
        data[j].anomalousTaskDetails[i]['taskData']['show'] = false;
        data[j].anomalousTaskDetails[i]['taskData']['anomalyType'] = _.startCase(data[j]['anomalyType']);
        this.tableData.push(data[j].anomalousTaskDetails[i]['taskData']);
      }
    }
  }

  private getLineChartData() {
    const that = this;
    that.partitionLineChartData = [];
    let dataType: string;
    if (that.ioDetailsArray.length > 0) {
      // eslint-disable-next-line @typescript-eslint/prefer-for-of
      for (let outerLoop = 0; outerLoop < that.ioDetailsArray.length; outerLoop++) {
        for (const [key, ioDeailsMap] of Object.entries(that.ioDetailsArray[outerLoop])) {
          const data = [];
          // eslint-disable-next-line @typescript-eslint/no-shadow
          for (const [key, localArray] of Object.entries(ioDeailsMap)) {
            if (key === 'type') {
              dataType = localArray;
            } else {
              data.push({
                name: key,
                values: localArray.map((d, i) => ({
                    'time': i,
                    'data': d
                  }))
              });
            }
          }
          if (dataType !== 'task') {
            that.partitionLineChartData.push({name: key, data: data, graphUnit: dataType});
          }
        }
      }
    }
  }

}

export interface TableDataType {
  anomalyType: string;
  applicationId: string;
  endTime: number;
  executorId: string;
  partition: number;
  partitionAttemptNumber: number;
  show: boolean;
  stageAttempt: number;
  stageId: number;
  startTime: number;
  successful: boolean;
  taskId: number;
}
