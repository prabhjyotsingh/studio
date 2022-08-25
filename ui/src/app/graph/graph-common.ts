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
import * as d3 from 'd3';
import _ from 'lodash';
import {Commons, NumberString} from '../services/commons.service';

export default class GraphCommon {
  public static LOWEST_DATE = 946684800000; // Jan 01 2000

  // Date format for application
  // this is for dateTimeFormat
  private static readonly timeFormat = d3.timeFormat('%H:%M:%S');
  // these are for formatXAxisLabel only
  private static readonly formatMillisecond = d3.timeFormat('.%L');
  private static readonly formatSecond = d3.timeFormat(':%S');
  private static readonly formatMinute = d3.timeFormat('%H:%M');
  private static readonly formatHour = d3.timeFormat('%H');
  private static readonly formatDay = d3.timeFormat('%a %d');
  private static readonly formatWeek = d3.timeFormat('%b %d');
  private static readonly formatMonth = d3.timeFormat('%B');
  private static readonly formatYear = d3.timeFormat('%Y');

  public static cleanUpLine(self) {
    self.container.node().innerHTML = '';
  }

  public static buildSvg(self) {
    self.svgObj['svg'] = self.container.append('svg')
    .style('width', self.width  + 'px')
    .style('height', self.height + self.margin.top + self.margin.bottom + 'px')
    .append('g')
    .attr('transform', 'translate(' + 53 + ',30)')
    .attr('class', 'svg');
    if (_.isUndefined(self.colors) || _.isEmpty(self.colors)) {
      self.colors = d3.schemeCategory10;
    }
  }

  public static formatYAxisLabel(self, num, floatPoint): NumberString {
    if (floatPoint !== undefined) {
      const fmt = d3.format(floatPoint);
      num = fmt(num);
    }
    if (self.graphUnit === 'byte' || self.graphUnit === 'bytes') {
      return Commons.formatBytes(num, self.floatPoint);
    } else if (self.graphUnit === 'percentage') {
      return (new NumberString(num, '%'));
    } else if (self.graphUnit === 'time' || self.graphUnit === 'duration') {
      return Commons.formatTime(num);
    } else if (self.graphUnit === 'counts') {
      return Commons.formatCount(num);
    } else {
      return (new NumberString(num, ''));
    }
  }

  public static dateTimeFormat(value): string {
    return GraphCommon.timeFormat(value);
  }

  public static formatXAxisLabel(date: Date): string {
    return (d3.timeSecond(date) < date ? GraphCommon.formatMillisecond
      : d3.timeMinute(date) < date ? GraphCommon.formatSecond
        : d3.timeHour(date) < date ? GraphCommon.formatMinute
          : d3.timeDay(date) < date ? GraphCommon.formatHour
            : d3.timeMonth(date) < date ? (d3.timeWeek(date) < date ? GraphCommon.formatDay
              : GraphCommon.formatWeek)
              : d3.timeYear(date) < date ? GraphCommon.formatMonth
                : GraphCommon.formatYear)(date);
  }

  public static drawTooltip(self) {
    if (self.showTooltip) {
      self.svgObj['tooltip-content'] = d3.select('.tooltip-content');
      if (self.svgObj['tooltip-content'].size() === 0) {
        self.svgObj['tooltip-content'] = d3.select('body').append('div')
        .attr('class', 'tooltip-content')
        .style('display', 'none');
      }
    }
  }

  public static drawTitle(self) {
    self.svgObj['svg'].append('text')
    .attr('height', 'auto')
    .attr('y', -25)
    .attr('x', -35)
    .attr('dy', '1em')
    .text((d) => {
      return self.title.indexOf(' ') === -1 ? Commons.getSentenceCase(self.title) : self.title;
    })
    .attr('class', 'y axis label chart-title');
  }

  public static getXPosition(self, val, i) {
    let x = 0;
    const xScale = self.svgObj['x'];
    if (self.scaleType === 'string') {
      const paddingBandwidth = xScale.bandwidth() / (xScale.domain().length - 1);
      if (paddingBandwidth !== Infinity) {
        x = xScale(val) + (paddingBandwidth);
      } else {
        x = xScale.bandwidth() / 2;
      }
    } else {
      x = xScale(val);
    }
    return x;
  }

  public static drawLegend(self) {
    if (self.showLegend) {
      const that = self;
      const legendHeight = 18;
      const tWidth = self.width - (self.margin.widthOffset);
      const legendGroup = self.svgObj['legend-group'] = self.svgObj['svg'].append('g')
      .style('width', tWidth + 'px')
      .attr('transform', 'translate(' + (70) + ',-40)')
      .attr('class', 'legend-group');
      const legend = legendGroup.selectAll('.legend')
      .data(that.data)
      .enter()
      .append('g')
      .attr('class', 'legend')
      .style('opacity', (d) => {
        const flag = self.checkLegendIndex(d.name);
        return flag > 0 ? 1 : 0.6;
      })
      .on('click', d => self.toggleLegends(d.name, self.data));
      legend.append('text')
      .attr('x', 15)
      .attr('y', 10)
      .attr('class', 'chart-title')
      .text(function (d) {
        return Commons.getSentenceCase(d.name);
      });
      let tempWidth = 0, tempHeight = legendHeight;
      legend.attr('transform', function (d, i) {
        const nodeWidth = d3.select(this).select('text').node().getComputedTextLength() + 20;
        const totalWidth = tWidth - 70;
        let width = totalWidth - nodeWidth - tempWidth;
        tempWidth += nodeWidth;
        if (tempWidth > (tWidth - 50)) {
          tempWidth = 0;
          that.paddingTop = legendHeight;
          width = totalWidth - nodeWidth;
          tempHeight += legendHeight;
        }
        return 'translate(' + width + ',' + tempHeight + ')';
      });
    }
  }

  public static drawLegendRect(self, type) {
    if (self.svgObj['legend-group'] && self.showLegend) {
      if (type === 'circle') {
        self.svgObj['legend-group'].selectAll('.legend')
          .append(type)
          .attr('opacity', 0.5)
          .attr('r', 6)
          .attr('cx', 4)
          .attr('cy', 6)
          .style('fill', (d, i) => {
            return self.colors[i];
          });

      } else {
        self.svgObj['legend-group'].selectAll('.legend')
          .append(type)
          .attr('width', 12)
          .attr('height', 12)
          .attr('rx', 2)
          .attr('ry', 2)
          .style('fill', (d, i) => {
            return self.colors[i];
          });
      }
    }
  }

  public static setcustomScaleInvert(self) {
    const thisSvg = self.svgObj['x'];
    thisSvg.invert = (function () {
      const domain = thisSvg.domain();
      const range = thisSvg.range();
      const scale = d3.scaleQuantize().domain(range).range(domain);
      return function (x) {
        return scale(x);
      };
    })();
  }

  public static showVerticalLine(obj: any) {
    const {that, field} = obj;
    const xPos = d3.mouse(this)[0];

    that.svgObj[field].select('.mouse-line')
    .attr('d', function () {
      let d = 'M' + xPos + ',' + that.height;
      d += ' ' + xPos + ',' + 0;
      return d;
    });
  }

  public static generateTooltipText(that: any, data: any) {
    const label = _.startCase(data.name);
    const value = GraphCommon.formatYAxisLabel(that, data.val, that.floatPoint);
    return `<tr>
      <td>
        <div class="${data.chartType}-widget" style="background-color:${that.colorMap.get(data.name)}">
        </div>
      </td>
      <td>${label}</td>
      <td>${data.time}</td>
      <td>${value}</td>
    </tr>`;
  }

  public static getMousePointerValue(obj: any) {
    const {that} = obj;
    if (that.scaleType === 'string') {
      GraphCommon.setcustomScaleInvert(that);
    }

    const bisectTime = d3.bisector(function (d) {
      return d.time;
    }).left;

    const x0 = that.svgObj['x'].invert(d3.mouse(this)[0]);
    let series = [];

    series = that.data.map(function (e) {
      const i = bisectTime(e.values, x0, 1);
      let d0 = e.values[i - 1],
        d1 = e.values[i];
      if (d1 === undefined) {
        d0 = e.values[i - 2];
        d1 = e.values[i - 1];
      }
      const allTicks = that.svgObj['xAxis'].scale().ticks();
      let lastTickVal;
      const seriesObject = {name: e.name, values: d0};
      if (allTicks !== undefined && allTicks !== null) {
        lastTickVal = (new Date(allTicks[allTicks.length - 1])).getTime();
      }
      if (lastTickVal <= d1.time) {
        if (x0 - d0.time > d1.time - x0) {
          seriesObject['values'] = d1;
        }
      }
      return seriesObject;
    });

    return series;
  }

  public static renderToolTipOnDom (self, str: string) {
    const evt = d3.event;
    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;
    const tooltip = d3.selectAll('.tooltip-content');
    const clientRect = tooltip.node().getBoundingClientRect();
    let top = evt.pageY, left = (evt.pageX + 20);
    if (top + clientRect.height > screenHeight) {
      top -= (clientRect.height - 20);
    }
    if (left + clientRect.width > screenWidth) {
      left -= (clientRect.width + 40);
    }
    tooltip.html(str)
      .style('top', (top) + 'px')
      .style('left', (left) + 'px');
  }

}
/*eslint-enable */
