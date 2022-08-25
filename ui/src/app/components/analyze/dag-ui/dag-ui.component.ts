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

/*eslint-disable */
import {
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges,
  ViewEncapsulation
} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import * as _ from 'lodash';
import * as d3 from 'd3';
import {ParentChildMessagingService} from '../../../services/parent-child-messaging.service';
import {
  Alerts,
  DagConstants,
  DebugLabels,
  Edges,
  Legend,
  StageMetricGradient,
  Stages,
  StageStatus
} from './dag';
import {WebsocketEventsService} from '../../../services/websocket-events.service';
import {Commons} from '../../../services/commons.service';
import GraphCommon from '../../../graph/graph-common';

declare var window: any;

@Component({
  selector: 'des-dag-ui',
  templateUrl: './dag-ui.component.html',
  styleUrls: ['./dag-ui.component.scss'],
  encapsulation: ViewEncapsulation.None
})

export class DagUiComponent implements OnInit, OnChanges {
  @Input() appServiceData: any;
  @Input() xDomain: Array<number> = [];
  @Input() xAxisTick: any;
  @Input() analysisState;
  @Output() scaleExtentEvent = new EventEmitter<number>();

  private config = {
    properties: {},
    margin: {top: 0, right: 85, bottom: 0, left: 100},
    width: window.innerWidth - 600,
    barHeight: 35,
    brushHeight: 75,
    brushContainerHeight: 40,
    height: 0
  };

  private containers = {
    swimlane: null,
    brush: null,
    xAxis: null,
    legend: null
  };

  private items = [];
  public stages = [];
  public stageApiErrorMessage: string;
  private alerts = [];
  private timeBegin;
  private timeEnd;
  private mainHeight;
  private defs;
  private main;
  private x1;
  private x2;
  private y1;
  private y2;
  private x1Axis;
  private x2Axis;
  private xGrid;
  private brushX;
  private stageRectsGroup;
  private zoom;
  private scaleExtent;
  private vertexPairs = [];
  private broadcastVertexPairs = [];
  private debug = false;
  private dagContainer;
  private xTransformVal = 44;
  private minusWidth = 143;
  public selectedStage;
  public showSelectedStageInfo = false;
  public sqlPlanUpdates;
  private selectedItems = [];
  public sortBy = 'stageId';
  public sortType = 'asc';
  public sortOptions = [
    {
      label: 'Stage Name',
      key: 'stageId'
    },
    {
      label: 'Duration',
      key: 'duration'
    }];

  private stageMetricColors = {
    wait: '#60b3d4',
    computation: '#9ce163',
    overhead: '#ffec66',
    unavailable: '#aeaeae',
    failed: '#ff91af'
  };
  public appId;

  constructor(private route: ActivatedRoute,
              private router: Router,
              private parentChildMessagingService: ParentChildMessagingService,
              private websocketEventsService: WebsocketEventsService,
              private element: ElementRef) {
    this.dagContainer = element;
  }

  ngOnInit() {
    this.appId = this.route.snapshot.paramMap.get('appId');
    this.websocketEventsService.webSocketReady.subscribe(() => {
      this.websocketEventsService.websocketEvents$.subscribe(
        (event: any) => {
          switch (event.type) {
            case 'STAGE_ALERTS':
              this.alerts = event.data;
              Alerts.draw(this, event.data);
              break;
          }
        }
      );
      this.websocketEventsService.sendNewEvent({
        'op': 'GET_STAGE_ALERTS',
        'data': {'appId': this.appId}
      });
    });
    this.config.width = this.getDagWidth() - this.minusWidth;
    this.cleanUpDag();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['appServiceData'] && this.appServiceData) {
      this.prepareData();
      this.renderDag();
    }
  }

  getDagWidth(): number {
    return this.dagContainer.nativeElement.parentElement.clientWidth;
  }

  cleanUpDag() {
    document.querySelector('#swimlane').innerHTML = '';
    document.querySelector('#brush').innerHTML = '';
    document.querySelector('#xAxis').innerHTML = '';
    document.querySelector('#legend').innerHTML = '';
  }

  private renderDag() {
    this.config.width = this.getDagWidth() - this.minusWidth;
    this.createScales();
    this.addAxes();
    this.setupContainers();
    this.createDefs();
    this.addLanes();
    this.setupBrushAndZoom();
    this.addLaneLabels();
    StageMetricGradient.setup(this.defs, this.items, this.stageMetricColors, this.selectedStage);
    if (this.alerts.length > 0) {
      Alerts.draw(this, this.alerts);
    }
  }

  private onSort(sortBy: string): void {
    if (this.sortBy === sortBy) {
      if (this.sortType === 'asc') {
        this.sortType = 'desc';
      } else {
        this.sortType = 'asc';
      }
    } else {
      this.sortBy = sortBy;
      this.sortType = 'asc';
    }
    this.prepareData();
    this.selectedItems = this.items;
    this.updateDag();
  }

  private updateDag(): void {
    Edges.draw(this, this.stageRectsGroup, this.vertexPairs, this.broadcastVertexPairs);
    this.addLaneLabels();
    this.drawStagesRect();
  }

  public getSelectedSortLabel(): string {
    return _.find(this.sortOptions, (option) => {
      return option.key === this.sortBy;
    }).label;
  }

  private prepareData() {
    const self = this;
    let data = [];
    this.sqlPlanUpdates = this.appServiceData['sqlPlanUpdates'];
    _.map(this.appServiceData, (value, key) => {
      const stageChanges = key === 'stageUpdates' ? value : undefined;
      if (stageChanges) {
        for (const item in stageChanges) {
          if (stageChanges.hasOwnProperty(item) && stageChanges[item]['running'] || stageChanges[item]['endTime']) {
            stageChanges[item]['stageName'] = item;
            data.push(stageChanges[item]);
            switch (this.sortBy) {
              case 'duration':
                data = _.sortBy(data, (d) => {
                  return d.endTime - d.startTime;
                });
                break;

              default:
                data = _.sortBy(data, (d) => {
                  return d[this.sortBy];
                });
                break;
            }
            if (this.sortType === 'desc') {
              data.reverse();
            }
          }
        }
      }
    });

    this.stages = [];
    this.items = data.map((item) => {
      const endTime = item['running'] ? this.appServiceData['highestEventTime'] : item['endTime'];
      const duration = Commons.formatTime(endTime - item['startTime']);
      const obj = {
        logicalParentStageIds: item['logicalParentStageIds'],
        broadcastParents: item['broadcastParents'],
        name: item['name'],
        start: item['startTime'],
        end: endTime,
        duration: duration.toString(),
        stage: item['stageId'],
        attemptId: item['attemptId'],
        id: 'item' + '_' + item['stageId'] + '_' + item['startTime'],
        isStatsAvailable: item['waitProportionPercentage'] !== undefined,
        stats: {
          waitProportionPercentage: item['waitProportionPercentage'],
          computeProportionPercentage: item['computeProportionPercentage'],
          overheadProportionPercentage: item['overheadProportionPercentage']
        },
        partitionToOutputBytes: item['partitionToOutputBytes'],
        partitionToInputBytes: item['partitionToInputBytes'],
        numPartitions: item['numPartitions'],
        numTasks: item['numTasks'],
        running: item['running'],
        stageSucceeded: item['stageSucceeded'],
        stageName: encodeURIComponent(item['stageName']),
        partitionToInputMetricBytesRead: item['partitionToInputMetricBytesRead'],
        inputMetricBytesRead: item['inputMetricBytesRead'],
        partitionToOutputMetricBytesWritten: item['partitionToOutputMetricBytesWritten'],
        outputMetricBytesWritten: item['outputMetricBytesWritten'],
        inputBytesRead: item['inputBytesRead'],
        outputBytesWritten: item['outputBytesWritten']

      };
      if (this.stages.findIndex(o => o.stage === item['stageId']) === -1) {
        this.stages.push({
          start: item['startTime'],
          end: endTime,
          stage: item['stageId']
        });
      }
      return obj;
    });

    if (this.stageApiErrorMessage === undefined) {
      const len = this.stages.length - 1;
      if (this.stages[len]['stage'] !== len) {
        this.stageApiErrorMessage = 'We have detected ' + (this.stages[len]['stage'] - len)
          + ' stages missing out of ' + len + '.';
      }
    }

    let index = 0;
    let previousStage = this.stages.length > 0 ? this.stages[0].stage : 0;
    this.vertexPairs = [];
    this.broadcastVertexPairs = [];
    this.items.map(function (item) {
      if (previousStage !== item.stage) {
        index++;
      }
      item['laneIndex'] = index;
      previousStage = item.stage;
      if (Array.isArray(item['logicalParentStageIds'])) {
        item['logicalParentStageIds'].map(function (stage) {
          const deps = self.items.filter(function (dep) {
            return dep.stage === stage.stageId && dep.attemptId === stage.attemptId;
          });
          if (deps !== undefined && deps.length > 0) {
            self.vertexPairs.push({
              source: deps[0],
              target: item
            });
          }
        });
      }

      if (Array.isArray(item['broadcastParents'])) {
        item['broadcastParents'].map(function (stageId) {
          const deps = self.items.filter(function (dep) {
            return dep.stage === stageId;
          });
          if (deps !== undefined && deps.length > 0) {
            self.broadcastVertexPairs.push({
              source: deps[0],
              target: item
            });
          }
        });
      }
    });
  }

  private setupContainers() {
    this.containers.swimlane = d3.select('#swimlane')
      .attr('style', 'width:' + (this.config.width + 70) + 'px;');
    const chartSvg = this.containers.swimlane.append('svg')
      .attr('width', this.config.width + this.xTransformVal)
      .attr('height', this.mainHeight)
      .attr('class', 'chart');

    chartSvg.on('wheel', function () {
    }, false); // scroll bar hack for FF

    this.main = chartSvg.append('g')
      .attr('width', this.config.width)
      .attr('height', this.mainHeight)
      .attr('class', 'main');

    this.main.append('g')
      .attr('class', 'grid')
      .call(this.xGrid);

    this.containers.xAxis = d3.select('#xAxis')
      .attr('style', 'width:' + (this.config.width + this.xTransformVal) + 'px;');
    const xAxisSvg = this.containers.xAxis.append('svg')
      .attr('height', 20)
      .attr('width', this.config.width + this.xTransformVal)
      .attr('class', 'x-axis-svg');

    this.containers.brush = d3.select('#brush')
      .attr('style', 'width:' + (this.config.width + this.xTransformVal) + 'px;');
    const xBrushSvg = this.containers.brush.append('svg')
      .attr('width', (this.config.width + this.xTransformVal))
      .attr('height', this.config.brushHeight);

    this.containers.brush = xBrushSvg.append('g')
      .attr('class', 'brush-container');

    xAxisSvg.append('g')
      .attr('class', 'x axis x1-axis')
      .attr('width', '500')
      .attr('transform', 'translate(' + 0 + ', ' + 0 + ')')
      .call(this.x1Axis)
      .selectAll('text')
      .style('font-size', '10px');

    this.containers.legend = d3.select('#legend')
      .attr('style', 'width:' + (this.config.width + 70) + 'px;');
  }

  private createScales() {
    const itemsLength = this.stages.length;
    if (itemsLength < 2) {
      this.config.height = 75;
    } else if (itemsLength < 3) {
      this.config.height = 100;
    } else if (itemsLength < 4) {
      this.config.height = 125;
    } else {
      this.config.height = this.config.barHeight * itemsLength;
    }

    this.mainHeight = this.config.height - this.config.brushContainerHeight;
    if (this.mainHeight < this.config.barHeight) {
      this.mainHeight = this.config.barHeight;
    }
    const width = this.config.width;

    this.timeBegin = this.xDomain[0];
    this.timeEnd = this.xDomain[1];

    this.scaleExtent = ((this.timeEnd - this.timeBegin) / (2000 * this.xAxisTick)).toFixed();
    this.scaleExtentEvent.emit(this.scaleExtent);

    this.x1 = d3.scaleTime().range([0, width]).domain([this.timeBegin, this.timeEnd]);
    this.x2 = d3.scaleTime().range([0, width]).domain([this.timeBegin, this.timeEnd]);
    this.y1 = d3.scaleLinear().range([0, this.mainHeight]).domain([0, itemsLength]);
    this.y2 = d3.scaleLinear().range([0, this.config.brushContainerHeight]).domain([0, itemsLength]);
  }

  private addAxes() {
    this.x1Axis = d3.axisBottom(this.x1).ticks(this.xAxisTick);
    this.x2Axis = d3.axisBottom(this.x2).ticks(this.xAxisTick).tickFormat(GraphCommon.formatXAxisLabel);
    this.xGrid = d3.axisBottom(this.x1).ticks(this.xAxisTick).tickSize(this.config.height);
  }

  private addLanes() {
    const self = this;
    if (this.stages.length) {
      Legend.draw(self.containers.legend, self.config, self.stageMetricColors);
      this.main.append('g').selectAll('.laneLines')
        .data(this.stages)
        .enter().append('line')
        .attr('stroke', function () {
          return '#7a7a7a';
        })
        .attr('class', 'dep-lines')
        .style('stroke-dasharray', 4)
        .attr('x1', 0)
        .attr('y1', function (d, i) {
          return self.y1(i + 0.6);
        })
        .attr('x2', this.config.width)
        .attr('y2', function (d, i) {
          return self.y1(i + 0.6);
        });
    } else {
      this.main.append('text')
        .attr('x', (this.config.width / 2) - 50)
        .attr('font-size', '12px')
        .attr('color', '#b4b4b4')
        .attr('y', 30)
        .text('The stage execution has not started');
    }
  }

  private addLaneLabels() {
    const self = this;
    if (this.stages.length) {
      let laneGroup = this.main.select('.lane-group');
      if (laneGroup.empty()) {
        laneGroup = this.main.append('g')
          .attr('class', 'lane-group');
      }

      const laneTexts = laneGroup.selectAll('.lane-text')
        .data(this.stages);

      laneTexts.exit().remove();

      laneTexts.enter().append('text')
        .attr('class', (d) => {
          const thisStage = self.findStage(d);
          let cls = 'lane-text';
          if (self.selectedStage && self.selectedStage.stage === thisStage.stage) {
            cls += ' highlight';
          }
          return cls;
        });

      laneGroup.selectAll('.lane-text')
        .on('click', (d) => {
          const item = self.findStage(d);
          self.showStageInfo(item);
        })
        .text(function (d) {
          return 'Stage ' + d.stage;
        })
        .attr('x', 0)
        .attr('y', function (d, i) {
          return self.y1(i + .5);
        });
    }
  }

  private findStage(d) {
    return _.findLast(this.items, (item) => item.stage === d.stage);
  }

  private showStageInfo(d) {
    this.selectedStage = d;
    this.showSelectedStageInfo = true;
    this.highlightSelectedStage();
  }

  private closeStageInfo(event) {
    this.showSelectedStageInfo = false;
    this.selectedStage = null;
    this.highlightSelectedStage();
  }

  private highlightSelectedStage() {
    Stages.clearStages(this.stageRectsGroup);
    this.main.select('.lane-group').remove();
    this.defs.remove();
    this.createDefs();
    StageMetricGradient.setup(this.defs, this.items, this.stageMetricColors, this.selectedStage);
    this.addLaneLabels();
    this.drawStagesRect();
  }

  private createDefs() {
    this.defs = this.main.append('svg:defs');
    this.defs.append('clipPath')
      .attr('id', 'clip')
      .append('rect')
      .attr('width', this.config.width)
      .attr('height', this.mainHeight);
  }

  private setupBrushAndZoom() {
    const self = this;

    if (self.stages.length > 0) {
      this.zoom = d3.zoom()
      .scaleExtent([1, self.scaleExtent])
        .translateExtent([[0, 0], [this.config.width, this.config.height]])
        .extent([[0, 0], [this.config.width, this.config.height]])
        .on('zoom', function() {
          self.handleZoomed();
        });

      this.main.append('rect')
        .attr('class', 'zoom cursor-default')
        .attr('width', this.config.width)
        .attr('height', this.mainHeight)
        .attr('opacity', 0);
        // .call(this.zoom);

      this.stageRectsGroup = this.main.append('g')
        .attr('clip-path', 'url(' + location.pathname + '#clip)');

      this.brushX = d3.brushX()
        .extent([[0, 0], [this.config.width, this.config.brushContainerHeight]])
        .on('brush', function () {
          self.createBrushDefsClipPath();
          self.brushHandle();
          self.handleBrushed(false);
        });

      this.containers.brush.append('g')
        .attr('class', 'x brush')
        .attr('transform', 'translate(' + 0 + ', ' + 10 + ')')
        .call(this.brushX)
        .call(this.brushX.move,
          [this.timeBegin, this.timeEnd].map(this.x1))
        .selectAll('rect')
        .attr('y', 1)
        .attr('height', this.config.brushContainerHeight - 3);

      this.containers.brush.selectAll('.overlay').on('touchstart.brush', function () {
        self.nobrush();
      }).on('mousedown.brush', function () {
        self.nobrush();
      });

      const brushTickGroup = this.containers.brush.append('g')
        .attr('class', 'axis axis--x x2-axis')
        .attr('transform', 'translate(0,' + (this.config.brushContainerHeight + 2) + ')')
        .call(this.x2Axis);

      brushTickGroup.select('path')
        .attr('transform', 'translate(0, 6)');

      brushTickGroup.selectAll('text')
        .attr('transform', 'translate(0, -20)');

      this.createBrushDefsClipPath();
      this.brushHandle();
      this.handleBrushed(true);
    }
  }

  private createBrushDefsClipPath() {
    const event = d3.event;
    if (!!event && !!event.selection) {
      const line = d3.line()
        .x((d) => d.x)
        .y((d) => d.y)
        .curve(d3.curveBasis);

      this.clearBrushHandleClipPath();
      const brush = this.containers.brush.selectAll('.brush');

      brush.append('clipPath')
        .attr('class', 'arrow-handle')
        .attr('id', 'brushLeftClip')
        .attr('width', 6)
        .attr('height', 36);

      brush.selectAll('.line-path-left')
        .data([{type: 'w'}])
        .enter()
        .append('path')
        .attr('class', 'line-path-left')
        .attr('cursor', 'ew-resize')
        .attr('fill', '#e4e4e4')
        .attr('stroke', '#b4b4b4')
        .attr('stroke-width', 3)
        .attr('transform', 'translate(' + (event.selection[0] - 4) + ', 2)')
        .attr('d', line(DagConstants.brushLeftHandlePath));

      brush.append('clipPath')
        .attr('class', 'arrow-handle')
        .attr('id', 'brushRightClip')
        .attr('width', 6)
        .attr('height', 36);

      brush.selectAll('.line-path-right')
        .data([{type: 'e'}])
        .enter()
        .append('path')
        .attr('class', 'line-path-right')
        .attr('cursor', 'ew-resize')
        .attr('fill', '#e4e4e4')
        .attr('stroke', '#b4b4b4')
        .attr('stroke-width', 3)
        .attr('transform', 'translate(' + (event.selection[1] - 1) + ', 2)')
        .attr('d', line(DagConstants.brushRightHandlePath));
      }
  }

  private clearBrushHandleClipPath() {
    const brush = this.containers.brush.selectAll('.brush');
    brush.selectAll('.arrow-handle').remove();
    brush.selectAll('.line-path-left').remove();
    brush.selectAll('.line-path-right').remove();
  }

  private brushHandle() {
    this.containers.brush.selectAll('rect.handle')
      .attr('y', '2')
      .attr('width', '6');

    this.containers.brush.select('rect.handle--w')
      .attr('clip-path', 'url(' + location.pathname + '#brushLeftClip)');

    this.containers.brush.select('rect.handle--e')
      .attr('clip-path', 'url(' + location.pathname + '#brushRightClip)');
  }

  private nobrush() {
    d3.event.stopImmediatePropagation();
  }

  private handleBrushed(firstLoad) {
    const self = this;
    let minExtent, maxExtent, selection;

    if (firstLoad) {
      self.selectedItems = this.items;
      minExtent = this.timeBegin;
      maxExtent = this.timeEnd;
      selection = this.x2.range();
    } else {
      selection = d3.event.selection;
      const timeSelection = selection.map(this.x1.invert, this.x1);
      minExtent = timeSelection[0];
      maxExtent = timeSelection[1];
      self.selectedItems = this.items.filter(function (d) {
        return d.start < maxExtent && d.end > minExtent;
      });
    }

    if (maxExtent - minExtent < ((2000 * this.xAxisTick))) {
      return;
    }

    self.parentChildMessagingService.publish('brush-zoom', {domainArr: [minExtent, maxExtent]});

    self.x2.domain([minExtent, maxExtent]);
    this.containers.xAxis.select('.x.axis').call(self.x2Axis);

    Edges.draw(self, self.stageRectsGroup, self.vertexPairs, self.broadcastVertexPairs);
    this.drawStagesRect();

    StageStatus.draw(self, self.stageRectsGroup, self.selectedItems);
    if (this.debug) {
      DebugLabels.draw(self, self.stageRectsGroup, self.selectedItems, minExtent);
    }

    if (d3.event && d3.event.sourceEvent) {
      if (d3.event.sourceEvent.type === 'mousemove') {
        this.main.select('.zoom').call(this.zoom.transform, d3.zoomIdentity
          .scale(this.config.width / (selection[1] - selection[0]))
          .translate(-selection[0], 0));
      }
    }
  }

  private drawStagesRect() {
    const {stageRectsGroup, selectedItems} = this;
    Stages.draw(this, stageRectsGroup, selectedItems);
  }

  private handleZoomed() {
    if ((d3.event && d3.event.sourceEvent && d3.event.sourceEvent.type === 'brush') || d3.event === null) {
      return;
    }

    try {
      const new_xScale = d3.event.transform.rescaleX(this.x1);
      this.containers.xAxis.select('.x.axis').transition().duration(0)
        .call(this.x1Axis.scale(new_xScale));
      this.containers.swimlane.select('.grid').transition().duration(0)
        .call(this.xGrid.scale(new_xScale));
      const t = d3.event.transform;
      this.containers.brush.select('.brush').call(this.brushX.move,
        this.x1.range().map(t.invertX, t));
    } catch (e) {
      console.log('e', e);
    }
  }

}
/*eslint-enable */
