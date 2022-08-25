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
  HostListener,
  Input,
  OnChanges,
  OnInit,
  SimpleChanges,
  ViewEncapsulation
} from '@angular/core';
import {Subject} from 'rxjs';
import {debounceTime} from 'rxjs/operators';
import _ from 'lodash';
import * as d3 from 'd3';
import {Commons} from '../../services/commons.service';
import LineChartConstants from '../../components/analyze/line-chart-constant';
import GraphCommon from '../graph-common';

@Component({
  selector: 'des-line-chart',
  template: '<ng-content></ng-content>',
  styleUrls: ['./line-chart.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class LineChartComponent implements OnInit, OnChanges {
  @Input() data: Array<any> = [];
  @Input() showTooltip: any = false;
  @Input() showLegend: any = false;
  @Input() colors: any = Commons.colors;
  @Input() title = '';
  @Input() scaleExt = 9;
  @Input() zoomValue: any;
  @Input() xAxisTk = 15;
  @Input() dagViewWidth: number;
  @Input() graphUnit: string;
  @Input() zoomable = true;
  @Input() combineBarChart: Array<string> = [];
  @Input() xDomain: Array<any> = [];

  private element;
  private resizeSubject = new Subject<number>();
  private resizeObservable = this.resizeSubject.asObservable().pipe(debounceTime(500));

  public width;
  public height = 80;
  public xAxisTick = 15;
  public scaleExtent = Infinity;
  private excludeLegends = [];
  public margin = {
    top: 50,
    right: 50,
    bottom: 50,
    left: 108,
    widthOffset: 65
  };
  private paddingTop = 0;
  public svgObj = {};
  public container;
  public zoomTransform;
  private floatPoint = '.0f';
  private scaleType = 'time';
  private filteredData = [];
  private barChartData = [];
  private lineChartConstants = new LineChartConstants();
  private colorMap = new Map();

  constructor(element: ElementRef) {
    this.element = element;
    this.margin.top = 20;
  }

  ngOnInit() {
    this.resizeObservable.subscribe(() => {
      this.init();
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['data'] && this.data && this.data.length > 0
      || changes['xDomain'] && this.xDomain
      && this.xDomain.length > 0) {
      this.init();
      if (this.xDomain.length === 0) {
        if (this.data[0]['values'].length < this.scaleExt) {
          this.scaleExtent = this.data[0]['values'].length - 1;
          this.xAxisTick = this.data[0]['values'].length - 1;
        } else {
          this.scaleExtent = this.scaleExt;
          this.xAxisTick = this.xAxisTk;
        }
      }
      this.renderLineChart();
    } else if (changes['zoomValue'] && this.zoomValue !== undefined) {
      this.zoomTransform = this.zoomValue;
      this.zoomed();
    }
  }

  @HostListener('window:resize', ['$event.target.innerWidth'])
  onResize(width: number) {
    this.resizeSubject.next(width);
  }

  init() {
    this.setWidth();
    this.container = d3.select(this.element.nativeElement);
  }

  private renderLineChart() {
    GraphCommon.cleanUpLine(this);
    this.setWidth();
    GraphCommon.buildSvg(this);
    GraphCommon.drawTooltip(this);
    GraphCommon.drawTitle(this);
    this.createScales();
    GraphCommon.drawLegend(this);
    GraphCommon.drawLegendRect(this, 'rect');
    this.createAxis();
    this.createClipPath();
    this.addZoom();
    this.drawLines();
    this.drawCircleOnVerticalLine();
    this.drawBars();
  }

  private setWidth = function () {
    this.width = (this.dagViewWidth - 79);
    if (this.dagViewWidth < 1) {
      this.width = this.element.nativeElement.parentElement.clientWidth - 110;
    }
  };

  private createScales = function () {
    if (this.combineBarChart !== undefined && this.combineBarChart.length > 0) {
      this.filteredData = _.filter(this.data, (d) => {
        return _.findIndex(this.combineBarChart, (b) => b === d.name) === -1;
      });
    } else {
      this.filteredData = this.data;
    }
    // Check if a valid date/time otherwise its a string
    if (!isNaN(this.data[0]['values'][0]['time'])
      && this.data[0]['values'][0]['time'] > GraphCommon.LOWEST_DATE) {
      this.svgObj['x'] = d3.scaleTime().range([0, this.width - this.margin.widthOffset]);
      this.svgObj['x2'] = d3.scaleTime().range([0, this.width - this.margin.widthOffset]);
      this.scaleType = 'time';
    } else {
      this.svgObj['x'] = d3.scaleBand().range([0, this.width - this.margin.widthOffset]);
      this.svgObj['x2'] = d3.scaleBand().range([0, this.width - this.margin.widthOffset]);
      this.scaleType = 'string';
    }

    this.svgObj['y'] = d3.scaleLinear().range([this.height, 0]);
    this.svgObj['y1'] = d3.scaleLinear().range([this.height, 0]);

    if (this.xDomain.length > 0) {
      this.svgObj['x'].domain(this.xDomain);
    } else {
      if (this.scaleType === 'time') {
        this.svgObj['x'].domain(d3.extent(this.data[0].values, function (d) {
          return d.time;
        }));
      } else {
        this.svgObj['x'].domain(_.map(this.data[0].values, (d) => d.time));
      }
    }

    let maxYAxis = [];
    if (this.excludeLegends.length !== 0) {
      maxYAxis = _.filter(this.data, (d) => {
        return _.findIndex(this.excludeLegends, (e) => e === d.name) === -1;
      });
    } else {
      maxYAxis = this.data;
    }
    const maxArr = _.map(maxYAxis, (d) => {
      return d3.max(d.values, function (d) {
        return d.data;
      });
    });
    const minArr = _.map(maxYAxis, (d) => {
      return d3.min(d.values, function (d) {
        return d.data;
      });
    });
    const minNumber = d3.min(minArr);
    const maxNumber = d3.max(maxArr);
    if (this.graphUnit === 'byte') {
      const minObj = GraphCommon.formatYAxisLabel(this, minNumber, this.floatPoint);
      const maxObj = GraphCommon.formatYAxisLabel(this, maxNumber, this.floatPoint);
      if (minObj.str === maxObj.str) {
        if (minObj.num >= maxObj.num - 3) {
          this.floatPoint = '0.2f';
        }
      }
    }

    this.svgObj['y'].domain([minNumber, maxNumber]);
    this.svgObj['x2'].domain(this.svgObj['x'].domain());
  };

  private createAxis = function () {
    if (this.scaleType === 'string') {
      const valueArrLength = this.data[0]['values'].length;
      const xAxisTick = this.xAxisTick;
      this.svgObj['xAxis'] = d3.axisBottom(this.svgObj['x'])
      .tickSize(4, 0)
      .tickValues(this.svgObj['x'].domain().filter((d, i) => {
          return !(i % (Math.floor((valueArrLength - 1) / xAxisTick)));
        }
      ));
    } else {
      this.svgObj['xAxis'] = d3.axisBottom(this.svgObj['x'])
      .ticks(this.xAxisTick)
      .tickFormat(GraphCommon.formatXAxisLabel);
    }

    this.svgObj['yAxis'] = d3.axisLeft(this.svgObj['y']).ticks(5)
    .tickSizeInner(0)
    .tickPadding(3)
    .tickSize(3, 0)
    .tickFormat((bytes) => {
      return GraphCommon.formatYAxisLabel(this, bytes, this.floatPoint);
    });

    this.svgObj['focus'] = this.svgObj['svg'].append('g')
    .attr('class', 'focus')
    .attr('transform', 'translate(' + 0 + ',' + this.paddingTop + ')');

    this.svgObj['focus'].append('g')
    .attr('class', 'line-axis-x')
    .attr('transform', 'translate(0,' + this.height + ')')
    .call(this.svgObj['xAxis'])
    .selectAll('g')
    .attr('transform', (d, i) => {
      const x = GraphCommon.getXPosition(this, d, i);
      return 'translate(' + x + ', 0)';
    });

    this.svgObj['focus'].append('g')
    .attr('class', 'line-axis-y')
    .call(this.svgObj['yAxis']);
  };

  private addZoom = function () {
    const that = this;
    this.svgObj['zoom'] = d3.zoom()
    .scaleExtent([1, this.scaleExtent])
    .translateExtent([[0, 0], [this.width - this.margin.widthOffset, this.height]])
    .extent([[0, 0], [this.width - this.margin.widthOffset, this.height]])
    .on('zoom', function () {
      that.zoomed();
    });

    this.svgObj['svg'].append('rect')
    .attr('class', 'zoom cursor-default')
    .attr('width', this.width - this.margin.widthOffset)
    .attr('height', this.height)
    .attr('transform', 'translate(' + 0 + ',' + this.paddingTop + ')')
    .on('mouseover', function () {
      that.svgObj['lineChart'].select('.mouse-line')
      .style('opacity', 1);
      that.svgObj['lineChart'].selectAll('.circle-group circle')
      .style('opacity', (d) => {
        return that.checkLegendIndex(d.name);
      });
      if (that.showTooltip) {
        that.svgObj['tooltip-content'].style('display', 'inline');
      }
    })
    .on('mouseout', function () {
      that.svgObj['lineChart'].select('.mouse-line')
      .style('opacity', 0);
      that.svgObj['lineChart'].selectAll('.circle-group circle')
      .style('opacity', 0);
      if (that.showTooltip) {
        that.svgObj['tooltip-content'].style('display', 'none');
      }
    })
    .on('mousemove', function () {
      if (that.showTooltip) {
        that.createTooltip.call(this, {that});
      }
    });
  };

  private createClipPath = function () {
    this.svgObj['svg'].append('defs').append('svg:clipPath')
    .attr('id', 'clipLine' + this.title)
    .append('svg:rect')
    .attr('width', this.width - this.margin.widthOffset)
    .attr('height', this.height)
    .attr('x', 0)
    .attr('y', 0);

    this.svgObj['lineChart'] = this.svgObj['svg'].append('g')
    .attr('class', 'focus')
    .attr('transform', 'translate(' + 0 + ',' + this.paddingTop + ')')
    .attr('clip-path', 'url(' + location.pathname + '#clipLine' + this.title + ')');
  };

  private drawLines = function () {
    this.svgObj['line'] = d3.line()
    .x((d, i) => {
      const x = GraphCommon.getXPosition(this, d.time, i);
      return x;
    })
    .y((d) => {
      return this.svgObj['y'](d.data);
    });

    const lineGroup = this.svgObj['lineChart'].selectAll('.line-group')
    .data(this.filteredData).enter()
    .append('g')
    .attr('class', 'line-group');

    lineGroup.append('path')
    .attr('class', 'line')
    .attr('d', d => this.svgObj['line'](d.values))
    .style('stroke', (d, i) => {
      this.colorMap.set(d.name, this.colors[i]);
      return this.colors[i];
    })
    .style('stroke-width', '1.5px')
    .style('opacity', (d) => {
      return this.checkLegendIndex(d.name);
    });
  };

  private getBarChartData() {
    return _.filter(this.data, (d) => {
      return _.findIndex(this.combineBarChart, (b) => b === d.name) !== -1;
    });
  }

  private createBarClipPath(name) {
    this.svgObj['svg'].append('defs').append('svg:clipPath')
    .attr('id', 'clipLine' + name)
    .append('svg:rect')
    .attr('width', this.width - this.margin.widthOffset)
    .attr('height', this.height)
    .attr('x', 0)
    .attr('y', 0);

    this.svgObj['barChart'] = this.svgObj['svg'].append('g')
    .attr('class', 'focus')
    .attr('transform', 'translate(' + 0 + ',' + this.paddingTop + ')')
    .attr('clip-path', 'url(' + location.pathname + '#clipLine' + name + ')');
  }

  private drawBars = function () {
    const that = this;
    this.barChartData = that.getBarChartData();

    if (this.barChartData.length > 0) {
      const name = this.barChartData[0].name;
      this.createY1AxisForBar();
      this.createBarClipPath(name);

      _.map(this.barChartData, (barData, ind) => {
        this.svgObj['stackColor'] = d3.scaleOrdinal()
        .range(that.lineChartConstants.stackedColors);

        this.svgObj['columnKeys'] = [ind];
        this.svgObj['stackColor'].domain(this.svgObj['columnKeys']);

        this.svgObj['barChartGroup'] = that.svgObj['barChart'].append('g')
        .attr('class', 'bar-chart-group');

        this.svgObj['barChartGroup'].selectAll('g')
        .data(barData.values)
        .enter()
        .append('rect')
        .attr('class', 'bar')
        .attr('fill', (d, i) => {
          this.colorMap.set(d.name, that.svgObj['stackColor'](1));
          return that.svgObj['stackColor'](1);
        })
        .attr('opacity', (d) => that.checkLegendIndex(barData.name))
        .attr('x', (d, i) => that.svgObj['x'](d.time))
        .attr('y', (d) => that.svgObj['y1'](d.data))
        .attr('height', (d) => that.height - that.svgObj['y1'](d.data))
        .attr('width', 4)
        .on('mouseover', function (d) {
          if (that.showTooltip) {
            that.svgObj['tooltip-content'].style('display', 'inline');
          }
        })
        .on('mouseout', function (d) {
          if (that.showTooltip) {
            that.svgObj['tooltip-content'].style('display', 'none');
          }
        })
        .on('mousemove', function (d) {
          if (that.showTooltip) {
            that.createTooltip.call(this, {that, barData: d});
          }
        });
      });
    }
  };

  private createY1AxisForBar = function () {
    const barmin = _.map(this.barChartData, (d) => {
      return d3.min(d.values, function (d) {
        return d.data;
      });
    });

    const barMax = _.map(this.barChartData, (d) => {
      return d3.max(d.values, function (d) {
        return d.data;
      });
    });

    this.svgObj['y1'].domain([barmin, barMax]);
  };

  private drawCircleOnVerticalLine = function () {
    const _data = this.filteredData.length > 0 ? this.filteredData : this.data;
    this.svgObj['circleGroup'] = this.svgObj['lineChart'].selectAll('.circle-group')
    .data(_data)
    .enter()
    .append('g')
    .attr('class', 'circle-group');

    this.svgObj['circleGroup'].append('circle')
    .attr('id', (d) => d.name)
    .attr('fill', 'none')
    .attr('stroke', (d, i) => Commons.darkenColor(this.colors[i], 20))
    .attr('stroke-width', '1px')
    .attr('r', 4)
    .attr('opacity', 0);
  };

  private zoomed = function () {
    if (this.zoomable) {
      const t = this.zoomTransform || d3.event.transform;
      this.svgObj['x'].domain(t.rescaleX(this.svgObj['x2']).domain());
      this.svgObj['lineChart'].selectAll('.line').attr('d', d => this.svgObj['line'](d.values));
      if (!!this.svgObj['barChart']) {
        this.svgObj['barChartGroup'].selectAll('.bar').attr('x',
          (d) => this.svgObj['x'](d.time)).attr('width', 4);
      }
      this.svgObj['focus'].selectAll('.line-axis-x').call(this.svgObj['xAxis']);
    }
  };

  private checkLegendIndex = function (legend: string): number {
    if (this.excludeLegends.length === 0) {
      return 1;
    }
    return _.findIndex(this.excludeLegends, e => e === legend) === -1 ? 1 : 0;
  };

  private toggleLegends = function (legend: string, data: Array<string>) {
    const legends = _.map(data, (d) => d.name);
    const index = _.findIndex(this.excludeLegends, e => e === legend);
    if (index === -1) {
      this.excludeLegends.push(legend);
      if (_.intersection(this.excludeLegends, legends).length === legends.length) {
        this.excludeLegends = _.difference(this.excludeLegends, legends);
      }
    } else {
      this.excludeLegends.splice(index, 1);
    }
    this.renderLineChart();
  };

  private createTooltip = function (obj: any) {
    const {that, barData} = obj;
    const tipStrArr = [];
    let series = GraphCommon.getMousePointerValue.call(this, {that});

    if (barData === undefined) {
      series = _.chain(series.reverse())
      .filter(function (f) {
        return _.findIndex(that.barChartData, (b) => b.name === f.name) === -1;
      })
      .map(function (s) {
        if (that.checkLegendIndex(s.name) > 0) {
          d3.select('circle#' + s.name)
          .attr('transform',
            'translate(' + that.svgObj['x'](s.values.time) + ', ' + that.svgObj['y'](s.values.data)
            + ')');
          tipStrArr.push(GraphCommon.generateTooltipText(that,
            {
              name: s.name,
              val: s.values.data,
              time: GraphCommon.dateTimeFormat(s.values.time),
              chartType: 'line'
            }
          ));
        }
      }).value();
    } else {
      tipStrArr.push(GraphCommon.generateTooltipText(that,
        {
          name: barData.name,
          val: barData.data,
          time: GraphCommon.dateTimeFormat(barData.time),
          chartType: 'bar'
        }
        )
      );
    }
    if (tipStrArr.length !== 0) {
      tipStrArr.unshift('<table>');
      tipStrArr.push('</table>');
      GraphCommon.renderToolTipOnDom(that, tipStrArr.join(' '));
    }
  };
}
/*eslint-enable */
