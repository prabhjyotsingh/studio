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

import {
  Component,
  HostListener,
  Inject,
  OnInit,
  QueryList,
  ViewChild,
  ViewChildren,
  ViewEncapsulation
} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import {Subject} from 'rxjs';
import {HttpClient} from '@angular/common/http';
import {debounceTime, map} from 'rxjs/operators';
import _ from 'lodash';
import {LoadingSpinner} from '../../services/loading-spinner.service';
import {WebsocketEventsService} from '../../services/websocket-events.service';
import {BaseUrlServiceService} from '../../services/base-url-service.service';
import {ParentChildMessagingService} from '../../services/parent-child-messaging.service';
import LineChartConstants from './line-chart-constant';
import {LineChartComponent} from '../../graph/line-chart/line-chart.component';
import {BreadcrumbDataService} from '../../services/breadcrumb-data.service';
import { MAT_DIALOG_DATA, MatDialog } from '@angular/material/dialog';

declare let window: any;

@Component({
  template: '<h1 mat-dialog-title>Analysis failed</h1>'
    + '<div mat-dialog-content>'
    + '  <p class="analysis_failed_message">'
    + '    {{data}}'
    + '  </p>'
    + '</div>',
})
export class AnalysisFailedMessageDialogComponent {
  constructor(@Inject(MAT_DIALOG_DATA) public data: string) {
  }
}

@Component({
  selector: 'des-analyze',
  templateUrl: './analyze.component.html',
  styleUrls: ['./analyze.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class AnalyzeComponent implements OnInit {
  @ViewChild('dagComp', { static: true }) dagComponent;
  @ViewChildren(LineChartComponent) lineChartComps: QueryList<LineChartComponent>;

  public width = 0;
  public appServiceData;
  public xAxisTick = 15;
  public scaleExtent;
  public sqlPlanUpdates;
  public sqlPlanIds;

  public stageMetricsShow = [
    'scheduleInformation',
    'cpuUsageGc',
    'memoryUsage',
    'iO'
  ];

  public lineChartConstants = new LineChartConstants();
  public colors = this.lineChartConstants.colors;
  public graphList = [
    {name: 'stageInformation', visibility: true, label: 'Stage Information'},
    {name: 'scheduleInformation', visibility: true, label: 'Schedule Information', graphUnit: ''},
    {name: 'cpuUsageGc', visibility: true, label: 'Cpu Usage Gc', graphUnit: 'percentage'},
    {name: 'memoryUsage', visibility: true, label: 'Memory Usage', graphUnit: 'byte'},
    {name: 'iO', visibility: true, label: 'IO', graphUnit: 'byte'}
  ];
  public lineChartsData = [];
  public jobId: string;
  public zoomTransform;
  public appId;
  public xDomain = [];
  public analysisState = '';
  public analysisFailedMessageTooltip = '';
  public analysisFailedMessage = '';

  private resizeSubject = new Subject<number>();
  private resizeObservable = this.resizeSubject.asObservable().pipe(debounceTime(500));

  constructor(private route: ActivatedRoute,
    private websocketEventsService: WebsocketEventsService,
    private parentChildMessagingService: ParentChildMessagingService,
    private breadcrumbDataService: BreadcrumbDataService,
    private router: Router,
    private http: HttpClient,
    private baseUrlServiceService: BaseUrlServiceService,
    public dialog: MatDialog) {
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
              this.jobId = this.appServiceData.applicationId;
              this.sqlPlanUpdates = this.appServiceData['sqlPlanUpdates'];
              if (this.sqlPlanUpdates) {
                this.sqlPlanIds = Object.keys(this.sqlPlanUpdates);
              }
              if (this.appServiceData.analysis) {
                this.analysisState = this.appServiceData.analysis.state;
                if (this.analysisState === 'FAILED') {
                  this.analysisFailedMessage = this.appServiceData.analysis.message;
                  if (this.analysisFailedMessage.length > 18) {
                    this.analysisFailedMessageTooltip = this.analysisFailedMessage.substr(0, 20)
                      + '...';
                  } else {
                    this.analysisFailedMessageTooltip = this.analysisFailedMessage;
                  }
                }
              }
              this.getGraphDomain();
              this.init();
              this.breadcrumbDataService.onChange(this.generateBreadcrumbs());
              break;
            case 'MEMORY_OUTPUT':
              this.appServiceData.memoryOutput = event.data;
              this.onScaleExtentEvent(this.scaleExtent);
              break;
            case 'CPU_USAGE':
              this.appServiceData.cpuUsage = event.data;
              this.onScaleExtentEvent(this.scaleExtent);
              break;
          }
        }
      );
      this.websocketEventsService.sendNewEvent(
        {'op': 'GET_APP_DETAILS', 'data': {'appId': this.appId}});
      this.websocketEventsService.sendNewEvent(
        {'op': 'GET_MEMORY_OUTPUT', 'data': {'appId': this.appId}});
      this.websocketEventsService.sendNewEvent(
        {'op': 'GET_CPU_USAGE', 'data': {'appId': this.appId}});
    });

    this.resizeObservable.subscribe(() => {
      this.cleanUpLine();
      this.init();
      this.dagComponent.cleanUpDag();
      // pass this.width to DAG renderDag function..
      this.width = this.dagComponent.getDagWidth();
      this.dagComponent.renderDag();
    });
    this.parentChildMessagingService.on('brush-zoom').subscribe((options: any) => {
      if (options.domainArr !== undefined && options.domainArr !== null) {
        const min = new Date(options.domainArr[0]).getTime();
        const max = new Date(options.domainArr[1]).getTime();
        this.xDomain = [min, max];
      }
    });
    this.parentChildMessagingService.on('sidebar-toggle').subscribe((options: any) => {
      this.dagComponent.cleanUpDag();
      this.width = this.dagComponent.getDagWidth();
      this.dagComponent.renderDag();
    });
  }

  generateBreadcrumbs() {
    return [
      {
        label: 'Applications',
        url: 'applications',
        params: this.appId
      }
    ];
  }

  appValidator(obj) {
    return obj !== undefined && obj.applicationId ? true : false;
  }

  onScaleExtentEvent(scaleExtent: number) {
    const that = this;
    that.scaleExtent = scaleExtent;
    that.getLineChartData();
  }

  init() {
    this.cleanUpLine();
    this.width = this.dagComponent.getDagWidth();
  }

  cleanUpLine() {
    LoadingSpinner.hide();
  }

  runAnalysis() {
    LoadingSpinner.show();
    this.http.get(
      this.baseUrlServiceService.getRestApiBase() + '/run_analysis?appId=' + this.appId).pipe(
      map(response => response)).subscribe(
      x => {
        this.appServiceData.analysis.state = 'IN_PROGRESS';
        this.analysisState = this.appServiceData.analysis.state;
        LoadingSpinner.hide();
      },
      e => {
        LoadingSpinner.hide();
      }
    );
  }

  showFailedMessage() {
    this.dialog.open(AnalysisFailedMessageDialogComponent, {
      data: this.analysisFailedMessage
    });
  }

  private getGraphDomain() {
    let timeBegin = this.appServiceData['lowestEventTime'];
    let timeEnd = this.appServiceData['highestEventTime'];
    const items = [];

    for (const stageKey in this.appServiceData['stageUpdates']) {
      if (this.appServiceData['stageUpdates'].hasOwnProperty(stageKey)) {
        const stage = this.appServiceData['stageUpdates'][stageKey];
        if (stage['running'] || stage['endTime']) {
          const end = stage['running'] ? this.appServiceData['highestEventTime'] : stage['endTime'];
          items.push({
            start: stage['startTime'],
            end: end,
            stage: stage['stageId']
          });
        }
      }
    }

    if (timeBegin === undefined) {
      timeBegin = Math.min.apply(null, items.map(item => item.start));
    }
    if (timeEnd === undefined || timeEnd === 0) {
      timeEnd = Math.max.apply(null, items.map(item => item.end));
    }
    this.xDomain = [timeBegin, timeEnd];
  }

  private getLineChartData() {
    this.lineChartsData = [];
    _.map(this.stageMetricsShow, (metric, i) => {
      const data = this.prepareData(metric);
      if (!_.isEmpty(data.data)) {
        this.lineChartsData.push(data);
      }
    });

    if (this.appServiceData.memoryOutput
      && Object.keys(this.appServiceData.memoryOutput).length > 0
      && this.lineChartsData.length > 0) {
      this.populateMemoryOutput();
    }

    if (this.appServiceData.cpuUsage
      && Object.keys(this.appServiceData.cpuUsage).length > 0) {
      this.populateCpuUsage();
    }
  }

  private prepareData(metric: string) {
    let obj: any = [];
    switch (metric) {
      case 'scheduleInformation':
        obj = this.populateData(this.lineChartConstants.scheduleInformation,
          'Distribution', metric);
        obj.combineBarFields = this.lineChartConstants.barChartFields;
        break;
      case 'cpuUsageGc':
        obj = this.populateData(this.lineChartConstants.cpuUsageGc, 'Percentage', metric);
        break;
      case 'memoryUsage':
        obj = this.populateData(this.lineChartConstants.memoryUsage, 'Distribution', metric);
        break;
      case 'iO':
        obj = this.populateData(this.lineChartConstants.io, 'Distribution', metric);
        break;
      default:
        break;
    }
    return obj;
  }

  private populateData(list: any, params: string, metric: string) {
    const array: any = [];
    const that = this;
    let obj = {graphUnit: '', visibility: true, label: ''};
    const dIndex = _.findIndex(this.stageMetricsShow, (d) => d === metric);
    _.map(list, (item, i) => {
      const data = this.appServiceData[item + params];
      obj = _.find(this.graphList, (g) => g.name === metric);
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
    return {
      name: metric,
      data: array,
      graphUnit: obj.graphUnit,
      dIndex: dIndex,
      visibility: obj.visibility,
      label: obj.label
    };
  }

  private populateMemoryOutput() {
    const that = this;
    const memoryUsageIdx = _.find(that.lineChartsData, obj => obj.name === 'memoryUsage').dIndex;

    if (that.lineChartsData[memoryUsageIdx] !== undefined
      && that.lineChartsData[memoryUsageIdx].data !== undefined
      && that.lineChartsData[memoryUsageIdx].data.length <= 2) {
      for (const [key, data] of Object.entries(that.appServiceData.memoryOutput)) {
        const newData = [];
        for (let i = 0; i < data['data'].length; i++) {
          newData.push({
            'data': data['data'][i],
            'time': data['time'][i]
          });
        }
        that.lineChartsData[memoryUsageIdx].data.push({
          'name': key,
          'values': newData
        });
      }
    }
  }

  private populateCpuUsage() {
    const that = this;
    const cpuUsageGcIdx = _.find(that.lineChartsData, obj => obj.name === 'cpuUsageGc').dIndex;

    if (that.lineChartsData[cpuUsageGcIdx] !== undefined
      && that.lineChartsData[cpuUsageGcIdx].data !== undefined
      && that.lineChartsData[cpuUsageGcIdx].data.length <= 2) {
      for (const [key, data] of Object.entries(that.appServiceData.cpuUsage)) {
        if (key === 'cpuTimeMsUsedDistribution') {
          continue;
        }
        const newData = [];
        for (let i = 0; i < data['data'].length; i++) {
          newData.push({
            'data': data['data'][i],
            'time': data['time'][i]
          });
        }
        that.lineChartsData[cpuUsageGcIdx].data.push({
          'name': key,
          'values': newData
        });
      }
    }
  }
}
