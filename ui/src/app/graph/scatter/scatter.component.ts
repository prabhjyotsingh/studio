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
import _ from 'lodash';
import {Subject} from 'rxjs';
import {debounceTime} from 'rxjs/operators';
import {Commons} from '../../services/commons.service';
import * as d3 from 'd3';
import GraphCommon from '../graph-common';
import LineChartConstants from '../../components/analyze/line-chart-constant';

@Component({
  selector: 'des-scatter',
  template: '<ng-content></ng-content>',
  styleUrls: ['./scatter.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class ScatterComponent implements OnInit, OnChanges {
  @Input() title = '';
  @Input() dagViewWidth;
  @Input() graphUnit;
  @Input() data: any;
  @Input() showTooltip: any = false;
  @Input() showLegend: any = false;
  @Input() colors: any = Commons.colorsScheme2;
  @Input() scaleExt = 9;
  @Input() xAxisTk = 15;

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
    widthOffset: 62
  };
  private paddingTop = 0;
  public svgObj = {};
  public container;
  public zoomTransform;
  private floatPoint = '.0f';
  private scaleType = 'time';
  private oldCircle = [];
  private colorMap = new Map();
  private lineChartConstants = new LineChartConstants();

  constructor(element: ElementRef) {
    this.element = element;
    this.margin.top = 20;
  }

  @HostListener('window:resize', ['$event.target.innerWidth'])
  onResize(width: number) {
    this.resizeSubject.next(width);
  }

  ngOnInit() {
    this.resizeObservable.subscribe(() => {
      this.init();
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['data'] && this.data && this.data.length > 0) {
      this.init();
      this.scaleExtent = this.scaleExt;
      this.xAxisTick = this.xAxisTk;
      this.renderScatterChart();
    }
  }

  init() {
    this.setWidth();
    this.container = d3.select(this.element.nativeElement);
  }

  setWidth() {
    this.width = this.dagViewWidth;
    if (this.dagViewWidth < 1) {
      this.width = this.element.nativeElement.parentElement.clientWidth;
    }
  }

  renderScatterChart() {
    GraphCommon.cleanUpLine(this);
    this.setWidth();
    GraphCommon.buildSvg(this);
    GraphCommon.drawTooltip(this);
    GraphCommon.drawTitle(this);
    this.createScales();
    GraphCommon.drawLegend(this);
    GraphCommon.drawLegendRect(this, 'circle');
    this.createAxis();
    this.createClipPath();
    this.drawCricle();
    this.addZoom();
  }

  createScales() {
    if (!isNaN(this.data[0]['values'][0]['time'])
      && this.data[0]['values'][0]['time'] > GraphCommon.LOWEST_DATE) {
      this.svgObj['x'] = d3.scaleTime().range([0, this.width - this.margin.widthOffset]);
      this.svgObj['y'] = d3.scaleLinear().range([this.height, 0]);
      this.scaleType = 'time';
    } else {
      this.svgObj['x'] = d3.scaleBand().range([0, this.width - this.margin.widthOffset]);
      this.svgObj['y'] = d3.scaleLinear().range([this.height, 0]);
      this.scaleType = 'string';
    }

    if (this.scaleType === 'time') {
      this.svgObj['x'].domain(d3.extent(this.data[0].values, function (d) {
        return d.time;
      }));
    } else {

      let maxTime = Number.MIN_SAFE_INTEGER;
      let minTime = Number.MAX_SAFE_INTEGER;

      Object.keys(this.data[0].values).map(key => {
        if (this.data[0]['values'][key]['time'] > maxTime) {
          maxTime = this.data[0]['values'][key]['time'];
        }
        if (this.data[0]['values'][key]['time'] < minTime) {
          minTime = this.data[0]['values'][key]['time'];
        }
      });
      maxTime++;
      const timeDomainArr = Array(maxTime - minTime).fill(0).map((e, i) => i + minTime);
      this.svgObj['x'].domain(timeDomainArr);
      this.svgObj['domainLength'] = timeDomainArr.length;
    }
    this.svgObj['x'].paddingOuter(7 / this.svgObj['x'].bandwidth());

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
    const padding = (maxNumber - minNumber) / this.height * 7;
    this.svgObj['y'].domain([minNumber - padding, maxNumber + padding]);
  }

  createAxis() {
    if (this.scaleType === 'string') {
      this.svgObj['xAxis'] = d3.axisBottom(this.svgObj['x'])
      .tickSize(4, 0)
      .tickValues(this.svgObj['x'].domain().filter((d, i) => {
          return !(i % (Math.floor((this.svgObj['domainLength'] - 1) / this.xAxisTick)));
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
    .attr('class', 'scatter-axis-x')
    .attr('transform', 'translate(0,' + this.height + ')')
    .call(this.svgObj['xAxis'])
    .selectAll('g')
    .attr('transform', (d, i) => {
      const x = GraphCommon.getXPosition(this, d, i);
      return 'translate(' + x + ', 0)';
    });

    this.svgObj['focus'].append('g')
    .attr('class', 'scatter-axis-y')
    .call(this.svgObj['yAxis']);
  }

  createClipPath() {
    this.svgObj['svg'].append('defs').append('svg:clipPath')
    .attr('id', 'clipScatter' + this.title)
    .append('svg:rect')
    .attr('width', this.width - this.margin.widthOffset)
    .attr('height', this.height)
    .attr('x', 0)
    .attr('y', 0);

    this.svgObj['scatterChart'] = this.svgObj['svg'].append('g')
    .attr('class', 'focus')
    .attr('transform', 'translate(' + 0 + ',' + this.paddingTop + ')')
    .attr('clip-path', 'url(#clipScatter' + this.title + ')');
  }

  checkLegendIndex(legend: string): number {
    if (this.excludeLegends.length === 0) {
      return 1;
    }
    return _.findIndex(this.excludeLegends, e => e === legend) === -1 ? 1 : 0;
  }

  toggleLegends(legend: string, data: Array<string>) {
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
    this.renderScatterChart();
  }

  createTooltip(obj: any) {
    const {that} = obj, newCircle = [];
    const tipStrArr = [];
    let series = [];
    if (that.scaleType === 'string') {
      GraphCommon.setcustomScaleInvert(that);
    }

    const bisectTime = d3.bisector(function (d) {
      return d.time;
    }).left;

    const x0 = that.svgObj['x'].invert(d3.mouse(this)[0]);

    series = that.data.map(function (e) {
      const i = bisectTime(e.values, x0, 1);
      let d0 = e.values[i - 1],
        d1 = e.values[i] || d0;
      if (d1 === undefined) {
        d0 = e.values[i - 2];
        d1 = e.values[i - 1];
      }
      const seriesObject = {name: e.name, values: d0};
      if (x0 - d0.time > d1.time - x0) {
        seriesObject['values'] = d1;
      }
      return seriesObject;
    });

    series = _.chain(series.reverse())
    .map(function (s) {
      if (that.checkLegendIndex(s.name) > 0) {
        newCircle.push(s.name.replace(' ', '').replace(',', '_') + '_' + s.values.time);
        const timeVal = that.getTimeValue(that, s.values.time);
        tipStrArr.push(GraphCommon.generateTooltipText(that,
          {
              name: s.name,
              val: s.values.data,
              time: timeVal,
              chartType: 'scatter'
            }
          )
        );
      }
    }).value();

    if (that.oldCircle.length > 0) {
      that.removeCircleAnimation.call(that);
    }

    if (newCircle.length > 0) {
      that.oldCircle = newCircle;
      that.addCircleAnimation.call(that, newCircle);
    }
    if (tipStrArr.length !== 0) {
      tipStrArr.unshift('<table>');
      tipStrArr.push('</table>');
      GraphCommon.renderToolTipOnDom(that, tipStrArr.join(' '));
    }
  }

  getTimeValue(that, time) {
    return that.scaleType === 'string' ? time : GraphCommon.dateTimeFormat(time);
  }

  drawCricle() {
    const that = this;
    const scatterGroup = this.svgObj['scatterChart'].selectAll('.series')
    .data(this.data)
    .enter().append('g')
    .attr('class', 'series')
    .style('fill', (d, i) => {
      this.colorMap.set(d.name, this.colors[i]);
      return this.colors[i];
    });

    scatterGroup.selectAll('.dot')
    .data((d) => {
      return d.values.map((m) => {
        m.name = d.name;
        return m;
      });
    })
    .enter().append('circle')
    .attr('class', 'dot')
    .attr('id', (d) => d.name.replace(' ', '').replace(',', '_') + '_' + d.time)
    .attr('opacity', 0.5)
    .attr('fill', (d) => {
      return this.colorMap.get(d.name);
    })
    .attr('r', 4)
    .attr('cx', (d, i) => GraphCommon.getXPosition(this, d.time, i))
    .attr('cy', (d) => this.svgObj['y'](d.data));
  }

  animateCircle(elem, radius: number) {
    d3.select(elem)
    .transition()
    .duration(100)
    .attr('r', (d) => radius);
  }

  removeCircleAnimation() {
    this.oldCircle.map((oCircle) => {
      this.animateCircle('#' + oCircle, 4);
    });
  }

  addCircleAnimation(newCircle: Array<any>) {
    newCircle.map((nCircle) => {
      this.animateCircle('#' + nCircle, 6);
    });
  }

  addZoom() {
    const that = this;
    this.svgObj['zoom'] = d3.zoom()
    .scaleExtent([1, this.scaleExtent])
    .translateExtent([[0, 0], [this.width  - this.margin.widthOffset, this.height]])
    .extent([[0, 0], [this.width  - this.margin.widthOffset, this.height]]);

    this.svgObj['svg'].append('rect')
    .attr('class', 'zoom cursor-default')
    .attr('width', this.width  - this.margin.widthOffset)
    .attr('height', this.height)
    .attr('transform', 'translate(' + 0 + ',' + this.paddingTop + ')')
    .on('mouseover', function () {
      that.svgObj['scatterChart'].select('.mouse-line')
      .style('opacity', 1);
      if (that.showTooltip) {
        that.svgObj['tooltip-content'].style('display', 'inline');
      }
    })
    .on('mouseout', function () {
      that.svgObj['scatterChart'].select('.mouse-line')
      .style('opacity', 0);
      if (that.showTooltip) {
        that.svgObj['tooltip-content'].style('display', 'none');
        that.removeCircleAnimation();
      }

    })
    .on('mousemove', function () {
      GraphCommon.showVerticalLine.call(this, {that, field: 'scatterChart'});
      if (that.showTooltip) {
        that.createTooltip.call(this, {that});
      }
    });
  }
}
/*eslint-enable */
