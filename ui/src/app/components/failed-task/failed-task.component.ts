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

import {Component, OnInit, HostListener, ViewChild} from '@angular/core';
import {ActivatedRoute} from '@angular/router';
import {Subject} from 'rxjs';
import {debounceTime} from 'rxjs/operators';

import {BreadcrumbDataService} from '../../services/breadcrumb-data.service';
import {LoadingSpinner} from '../../services/loading-spinner.service';
import {WebsocketEventsService} from '../../services/websocket-events.service';
import {ParentChildMessagingService} from '../../services/parent-child-messaging.service';
import * as _ from 'lodash';
import LineChartConstants from '../analyze/line-chart-constant';

declare let window: any;

@Component({
  selector: 'des-failed-task',
  templateUrl: './failed-task.component.html',
  styleUrls: ['./failed-task.component.scss']
})

export class FailedTaskComponent implements OnInit {
  @ViewChild('container', { static: true }) container;
  public appServiceData;
  public appId;
  public sqlPlanIds;
  public width = 0;
  public pieChartData = [];
  public executorPieChartData = [];
  public executorErrorColors = [
    '#b85600',
    '#c95e00',
    '#da6600',
    '#eb6e00',
    '#fc7600',
    '#ff7f0e',
    '#ff881f',
    '#ff9130',
    '#ff9a41',
    '#ffa352',
    '#ffac63',
    '#ffb574',
    '#ffbe85',
    '#ffc796',
    '#ffd0a7'
  ];

  public lineChartConstants = new LineChartConstants();
  public colors = this.lineChartConstants.colors;
  public stageMetricsShow = [
    'scheduleInformation'
  ];

  public sunBurstData = {};
  public colorEnum = {
    info: '#feff6e',
    warn: '#faa500',
    critical: '#3be4ff',
    failed: '	#f90500'
  };
 public lineChartsData = [];

  private sqlPlanUpdates;
  private resizeSubject = new Subject<number>();
  private resizeObservable = this.resizeSubject.asObservable().pipe(debounceTime(500));

  constructor(private route: ActivatedRoute,
    private websocketEventsService: WebsocketEventsService,
    private breadcrumbDataService: BreadcrumbDataService,
    private parentChildMessagingService: ParentChildMessagingService) {
  }

  @HostListener('window:resize', ['$event.target.innerWidth'])
  onResize(width: number) {
    this.resizeSubject.next(width);
  }

  ngOnInit() {
    this.appId = this.route.snapshot.paramMap.get('appId');
    LoadingSpinner.show();
    this.websocketEventsService.webSocketReady.subscribe(() => {
      this.websocketEventsService.websocketEvents$.subscribe(
        (event: any) => {
          switch (event.type) {
            case 'APP_DETAILS':
              LoadingSpinner.hide();
              this.appServiceData = event.data;
              this.sqlPlanUpdates = this.appServiceData['sqlPlanUpdates'];
              if (this.sqlPlanUpdates) {
                this.sqlPlanIds = Object.keys(this.sqlPlanUpdates);
              }
              this.init();
              this.breadcrumbDataService.onChange(this.generateBreadcrumbs());
              break;
          }
          this.init();
          this.getLineChartData();
        }
      );
      this.websocketEventsService.sendNewEvent({'op': 'GET_APP_DETAILS', 'data': {'appId': this.appId}});
      this.websocketEventsService.sendNewEvent({'op': 'GET_SQL_PLAN_UPDATES', 'data': {'appId': this.appId}});
    });

    this.resizeObservable.subscribe(() => {
      this.init();
      this.getLineChartData();
    });

    this.parentChildMessagingService.on('sidebar-toggle').subscribe((options: any) => {
      this.init();
      this.getLineChartData();
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
        params: 'Failed Task'
      }
    ];
  }

  init() {
    this.width = this.container.nativeElement.clientWidth + 30;
  }

  populateStaticData() {
    this.pieChartData = [
      {
        name: 'Info',
        value: 3
      },
      {
        name: 'Warn',
        value: 1
      },
      {
        name: 'Critical',
        value: 2
      }
    ];

    this.executorPieChartData = [
      {name: 10, value: 2},
      {name: 9, value: 4},
      {name: 8, value: 1},
      {name: 7, value: 7},
      {name: 6, value: 3},
      {name: 5, value: 23},
      {name: 4, value: 3}
    ];

    this.sunBurstData = {
      name: 'root',
      children: [
        {
          name: 'node_1',
          children: [
            {
            name: 'info',
            size: 4
            },
            {
            name: 'warn',
            size: 1
            },
            {
              name: 'critical',
              size: 2
            },
            {
              name: 'failed',
              size: 1
            }
          ]
        },
        {
          name: 'node_2',
          children: [
            {
              name: 'info',
              size: 1
            },
            {
              name: 'warn',
              size: 3
            }
          ]
        },
        {
          name: 'node_3',
          children: [
            {
              name: 'warn',
              size: 3
            },
            {
              name: 'critical',
              size: 1
            },
            {
              name: 'failed',
              size: 1
            }
          ]
        },
        {
          name: 'node_4',
          children: [
            {
            name: 'info',
            size: 4
            },
            {
            name: 'warn',
            size: 1
            },
            {
              name: 'critical',
              size: 2
            }
          ]
        },
        {
          name: 'node_5',
          children: [
            {
            name: 'info',
            size: 4
            },
            {
            name: 'warn',
            size: 1
            },
            {
              name: 'critical',
              size: 2
            }
          ]
        },
        {
          name: 'node_6',
          children: [
            {
            name: 'info',
            size: 4
            },
            {
            name: 'warn',
            size: 1
            },
            {
              name: 'critical',
              size: 2
            },
            {
              name: 'failed',
              size: 1
            }
          ]
        },
        {
          name: 'node_7',
          children: [
            {
            name: 'info',
            size: 4
            },
            {
            name: 'warn',
            size: 1
            },
            {
              name: 'critical',
              size: 2
            }
          ]
        },
                {
          name: 'node_8',
          children: [
            {
            name: 'info',
            size: 4
            },
            {
            name: 'warn',
            size: 1
            },
            {
              name: 'critical',
              size: 2
            }
          ]
        },
                {
          name: 'node_9',
          children: [
            {
            name: 'info',
            size: 4
            },
            {
            name: 'warn',
            size: 1
            },
            {
              name: 'critical',
              size: 2
            },
            {
              name: 'failed',
              size: 1
            }
          ]
        },
                {
          name: 'node_10',
          children: [
            {
            name: 'info',
            size: 4
            },
            {
            name: 'warn',
            size: 1
            },
            {
              name: 'critical',
              size: 2
            }
          ]
        },
                {
          name: 'node_11',
          children: [
            {
            name: 'info',
            size: 4
            },
            {
            name: 'warn',
            size: 1
            },
            {
              name: 'critical',
              size: 2
            }
          ]
        },
                {
          name: 'node_12',
          children: [
            {
            name: 'info',
            size: 4
            },
            {
            name: 'warn',
            size: 1
            },
            {
              name: 'critical',
              size: 2
            },
            {
              name: 'failed',
              size: 1
            }
          ]
        },
                {
          name: 'node_13',
          children: [
            {
            name: 'info',
            size: 4
            },
            {
            name: 'warn',
            size: 1
            },
            {
              name: 'critical',
              size: 2
            }
          ]
        },
        {
          name: 'node_14',
          children: [
            {
            name: 'info',
            size: 4
            }
          ]
        },
                {
          name: 'node_15',
          children: [
            {
            name: 'info',
            size: 4
            },
            {
            name: 'warn',
            size: 1
            },
            {
              name: 'failed',
              size: 1
            }
          ]
        },
                {
          name: 'node_16',
          children: [
            {
            name: 'info',
            size: 4
            },
            {
            name: 'warn',
            size: 1
            },
            {
              name: 'critical',
              size: 2
            }
          ]
        },
                {
          name: 'node_17',
          children: [
            {
            name: 'info',
            size: 4
            },
            {
            name: 'warn',
            size: 1
            },
            {
              name: 'critical',
              size: 2
            }
          ]
        },
                {
          name: 'node_18',
          children: [
            {
            name: 'info',
            size: 4
            },
            {
            name: 'warn',
            size: 1
            },
            {
              name: 'critical',
              size: 2
            }
          ]
        },
                {
          name: 'node_19',
          children: [
            {
            name: 'info',
            size: 4
            },
            {
            name: 'warn',
            size: 1
            },
            {
              name: 'critical',
              size: 2
            }
          ]
        },
                {
          name: 'node_20',
          children: [
            {
            name: 'info',
            size: 4
            },
            {
            name: 'warn',
            size: 1
            },
            {
              name: 'critical',
              size: 2
            }
          ]
        },
                {
          name: 'node_21',
          children: [
            {
            name: 'info',
            size: 4
            },
            {
            name: 'warn',
            size: 1
            },
            {
              name: 'critical',
              size: 2
            }
          ]
        },
                {
          name: 'node_22',
          children: [
            {
            name: 'info',
            size: 4
            },
            {
            name: 'warn',
            size: 1
            },
            {
              name: 'critical',
              size: 2
            }
          ]
        },
                {
          name: 'node_23',
          children: [
            {
            name: 'info',
            size: 4
            },
            {
            name: 'warn',
            size: 1
            },
            {
              name: 'critical',
              size: 2
            },
            {
              name: 'failed',
              size: 1
            }
          ]
        },
                {
          name: 'node_24',
          children: [
            {
            name: 'info',
            size: 4
            },
            {
            name: 'warn',
            size: 1
            },
            {
              name: 'critical',
              size: 2
            }
          ]
        },
                {
          name: 'node_25',
          children: [
            {
            name: 'info',
            size: 4
            },
            {
            name: 'warn',
            size: 1
            },
            {
              name: 'critical',
              size: 2
            }
          ]
        },
                {
          name: 'node_26',
          children: [
            {
            name: 'info',
            size: 4
            },
            {
            name: 'warn',
            size: 1
            },
            {
              name: 'critical',
              size: 2
            }
          ]
        },
                {
          name: 'node_27',
          children: [
            {
            name: 'info',
            size: 4
            },
            {
            name: 'warn',
            size: 1
            },
            {
              name: 'critical',
              size: 2
            }
          ]
        },
                {
          name: 'node_28',
          children: [
            {
            name: 'info',
            size: 4
            },
            {
            name: 'warn',
            size: 1
            },
            {
              name: 'critical',
              size: 2
            }
          ]
        },
                {
          name: 'node_29',
          children: [
            {
            name: 'info',
            size: 4
            },
            {
            name: 'warn',
            size: 1
            },
            {
              name: 'critical',
              size: 2
            },
            {
              name: 'failed',
              size: 2
            }
          ]
        },
                {
          name: 'node_30',
          children: [
            {
            name: 'info',
            size: 4
            },
            {
            name: 'warn',
            size: 1
            },
            {
              name: 'critical',
              size: 2
            }
          ]
        },
                {
          name: 'node_31',
          children: [
            {
            name: 'info',
            size: 4
            },
            {
            name: 'warn',
            size: 1
            },
            {
              name: 'critical',
              size: 2
            }
          ]
        }
      ]
    };
  }

  getLineChartData() {
    this.populateStaticData();
    this.lineChartsData = [];
    _.map(this.stageMetricsShow, (metric, i) => {
      const data = this.prepareData(metric);
      if (!_.isEmpty(data.data)) {
        this.lineChartsData.push(data);
      }
    });
  }

  prepareData(metric: string) {
    let obj: any = [];
    switch (metric) {
      case 'scheduleInformation':
        obj = this.populateData(this.lineChartConstants.scheduleInformation, 'Distribution', metric, 'byte');
        obj.combineBarFields = this.lineChartConstants.barChartFields;
        break;
      default:
        break;
    }
    return obj;
  }


  populateData(list: any, params: string, metric: string, graphUnit: string) {
    const array: any = [];
    const that = this;
    _.map(list, (item, i) => {
      const data = this.appServiceData[item + params];
      if (data) {
        array.push({
          name: item,
          // eslint-disable-next-line @typescript-eslint/no-shadow
          values: data.time.map((d, i) => {
            const o = {};
            const barField = _.findIndex(that.lineChartConstants.barChartFields, (f) => f === item);
            if (barField !== -1) {
              o['name'] = item;
            }
            o['data'] = data.data[i];
            o['time'] = data.time[i];
            return o;
          })
        });
      }
    });
    return {name: metric, data: array, graphUnit: graphUnit};
  }



}
