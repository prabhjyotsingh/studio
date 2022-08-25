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
import { Component, OnInit, ViewChild, SimpleChanges, OnChanges, Input } from '@angular/core';
import * as d3 from 'd3';
import * as _ from 'lodash';

@Component({
  selector: 'des-sunburst-chart',
  templateUrl: './sun-burst.component.html',
  styleUrls: ['./sun-burst.component.scss']
})

export class SunBurstComponent implements OnInit, OnChanges {
  @ViewChild('chart', { static: true }) chartEl;
  @ViewChild('chartLegend', { static: true }) chartLegendEl;
  @ViewChild('chartWrapper', { static: true }) chartWrapper;

  @Input() datum: any = {};
  @Input() showLegend = false;
  @Input() graphWidth: number;
  @Input() showTooltip = false;
  @Input() colors = [];
  @Input() leaveNodeColors = {};
  @Input() titleCenter = true;

  private svgObj = {};
  private color_palettes = [
    ['#4abdac', '#fc4a1a', '#f7b733'],
    ['#f03b20', '#feb24c', '#ffeda0'],
    ['#007849', '#0375b4', '#ffce00'],
    ['#373737', '#dcd0c0', '#c0b283'],
    ['#e37222', '#07889b', '#eeaa7b'],
    ['#062f4f', '#813772', '#b82601'],
    ['#565656', '#76323f', '#c09f80']
  ];
  private radius;
  private first_build;
  private node;

  private chartContainer;
  private legendContainer;
  private config = {
    width: 180,
    height: 180
  };
  private rootColor = '#E2E2E0';

  constructor() {  }

  ngOnInit() {
    this.init();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['datum'] &&  !_.isEmpty(this.datum)) {
      this.cleanUpChart();
      this.init();
      this.renderChart();
    }
  }

  cleanUpChart() {
    if (this.legendContainer && this.legendContainer.node()) {
      const legendNode = this.legendContainer.node();
      legendNode.style.width = '0px';
      legendNode.innerHTML = '';
    }
    this.chartContainer.node().innerHTML = '';
  }

  setWidth() {
    this.chartWrapper.nativeElement.style.width = this.config.width;
    if (this.showLegend) {
      this.chartWrapper.nativeElement.style.width = (this.config.width * 2) + 10 + 'px';
      this.legendContainer = d3.select(this.chartLegendEl.nativeElement);
      this.legendContainer.node().style.width = (this.config.width - 10) + 'px';
    }
  }

  init() {
    this.setWidth();
    this.chartContainer = d3.select(this.chartEl.nativeElement);
  }

  buidSvg() {
    if (!_.isUndefined(this.graphWidth) || !_.isEmpty(this.graphWidth)) {
      this.config.height = this.config.width = this.graphWidth;
    }

    this.svgObj['svg'] = this.chartContainer.append('svg')
      .attr('class', 'main-svg')
      .attr('width', this.config.width)
      .attr('height', this.config.height)
      .append('g')
      .attr('id', 'bigG')
      .attr('transform', 'translate(' + this.config.width / 2 + ',' + (this.config.height / 2) + ')');
  }

  renderChart() {
    this.buidSvg();
    this.initialSetup();
    this.createScale();
    this.createArc();
    this.update();
    this.addtitleCenter();
    // this.drawLegend();
    this.drawTooltip();
  }

  initialSetup() {
    this.first_build = true;
    this.svgObj['root'] = d3.hierarchy(this.datum);
    this.radius = (Math.min(this.config.width, this.config.height) / 2) - 10;
    this.svgObj['partition'] = d3.partition();
    let col = this.colors;
    if (_.isUndefined(this.colors) || _.isEmpty(this.colors)) {
      col = this.color_palettes;
    }
    this.svgObj['color'] = d3.scaleLinear().domain([0, 0.5, 1]).range(col[2]);
  }

  createScale() {
    this.svgObj['x'] = d3.scaleLinear().range([0, 2 * Math.PI]);
    this.svgObj['y'] = d3.scaleSqrt().range([0, this.radius]);
  }

  createArc() {
    const self = this;
    this.svgObj['arc'] = d3.arc()
      .startAngle(function (d) { return Math.max(0, Math.min(2 * Math.PI, self.svgObj['x'](d.x0))); })
      .endAngle(function (d) { return Math.max(0, Math.min(2 * Math.PI, self.svgObj['x'](d.x1))); })
      .padAngle(d => Math.min((d.x1 - d.x0) / 2, 0.005))
      .padRadius(self.radius * 1)
      .innerRadius(function (d) { return Math.max(0, self.svgObj['y'](d.y0) + 1); })
      .outerRadius(function (d) { return Math.max(0, self.svgObj['y'](d.y1)); });
  }

  update() {
    const self = this;
    this.svgObj['root'].sum(function (d) { return d.size; });

    if (this.first_build) {
      const sectionGroup = this.svgObj['svg'].selectAll('g')
        .data(this.svgObj['partition'](this.svgObj['root']).descendants(), function (d) { return d.data.id; })
        .enter()
        .append('g');

      sectionGroup.exit().remove();
      sectionGroup.append('path')
        .style('fill', function (d) {
          let col = self.rootColor;
          if (!_.isEmpty(d.parent)) {
            col =  self.leaveNodeColors[d.data.name] !== undefined ? self.leaveNodeColors[d.data.name]  : self.svgObj['color'](d.x0);
          }
          return col;
        })
        .on('click', function (d) { self.handleClick.call(this, { self, d }); })
        .on('mouseover', function(d) {
          if (self.showTooltip && d.data.name !== '') {
            self.svgObj['tooltip-content'].style('display', 'inline');
          }
          self.handleMouseover.call(this, {self, d});
        })
        .on('mousemove', function (d) {
          if (self.showTooltip) {
            self.createTooltip.call(this, { self, data: d });
          }
        })
        .on('mouseout', function(d) {
          if (self.showTooltip) {
            self.svgObj['tooltip-content'].style('display', 'none');
          }
          self.handleMouseOut.call(this, {self, d});
        });

      this.first_build = false;
    } else {
      this.svgObj['svg'].selectAll('path')
        .data(this.svgObj['partition'](this.svgObj['root']).descendants());
    }

    this.svgObj['svg'].selectAll('path')
      .transition('update')
      .duration(750)
      .attrTween('d', function (d, i) {
        return self.arcTweenPath(d, i);
      });
  }

  getAncestors(node) {
    const path = [];
    let current = node;
    while (current.parent) {
      path.unshift(current);
      current = current.parent;
    }
    return path;
  }

  handleMouseover (obj) {
    const { self, d } = obj;
    const sequenceArray = self.getAncestors(d);
    self.svgObj['svg'].selectAll('path')
      .style('opacity', 0.5);

    self.svgObj['svg'].selectAll('path')
    .filter(function(node) {
              return (sequenceArray.indexOf(node) >= 0);
            })
    .style('opacity', 1);
  }

  handleMouseOut(obj) {
    const { self, d } = obj;
    self.svgObj['svg'].selectAll('path')
      .style('opacity', 1);
  }

  handleClick(obj) {
    const { self, d } = obj;
    self.node = d;

    self.svgObj['svg'].selectAll('path')
      .transition('click')
      .duration(750)
      .attrTween('d', function (d, i) {
        const textNode = d3.selectAll('.title');
        if (self.node.depth > 1) {
          textNode.attr('display', 'none');
        } else {
          textNode.attr('display', 'block');
        }
        return self.arcTweenPath(d, i);
      });
  }

  arcTweenText(a, i) {
    const self = this;
    const oi = d3.interpolate({ x0: (a.x0s ? a.x0s : 0), x1: (a.x1s ? a.x1s : 0), y0: (a.y0s ? a.y0s : 0), y1: (a.y1s ? a.y1s : 0) }, a);
    function tween(t) {
      const b = oi(t);
      const ang = ((self.svgObj['x']((b.x0 + b.x1) / 2) - Math.PI / 2) / Math.PI * 180);
      b.textAngle = (ang > 90) ? 180 + ang : ang;
      a.centroid = self.svgObj['arc'].centroid(b);
      return 'translate(' + self.svgObj['arc'].centroid(b) + ')rotate(' + b.textAngle + ')';
    }
    return tween;
  }


  arcTweenPath(a, i) {
    const self = this;
    const oi = d3.interpolate({ x0: (a.x0s ? a.x0s : 0), x1: (a.x1s ? a.x1s : 0), y0: (a.y0s ? a.y0s : 0), y1: (a.y1s ? a.y1s : 0) }, a);
    function tween(t) {
      const b = oi(t);
      a.x0s = b.x0;
      a.x1s = b.x1;
      a.y0s = b.y0;
      a.y1s = b.y1;
      return self.svgObj['arc'](b);
    }
    if (i === 0 && this.node) {
      const xd = d3.interpolate(self.svgObj['x'].domain(), [self.node.x0, self.node.x1]);
      const yd = d3.interpolate(self.svgObj['y'].domain(), [self.node.y0, 1]);
      const yr = d3.interpolate(self.svgObj['y'].range(), [self.node.y0 ? 40 : 0, self.radius]);

      return function (t) {
        self.svgObj['x'].domain(xd(t));
        self.svgObj['y'].domain(yd(t)).range(yr(t));
        return tween(t);
      };
    } else {
      return tween;
    }
  }

  drawLegend () {
    if (this.showLegend) {
      const arr = [];
      const self = this;
      const legendData = this.svgObj['partition'](this.svgObj['root']).descendants();
      const _parent = _.filter(legendData, (l) => l.data.children && l.data.name !== '');
      const _leave = _.chain(legendData).filter((l) => l.data.children === undefined).unionBy((d) => d.data.name).value();
      arr.push(_parent);
      arr.push(_leave);
      _.map(arr, (a, i) => {
        if (a.length > 0 ) {
          self.addLegend(a, i);
        }
      });
    }
  }

  addLegend(_data: Array<any>, ind: number) {
    if (this.showLegend) {
      const self = this;
      const legendRectSize = 12;
      const legendSpacing = 7;
      const legendHeight = legendRectSize + legendSpacing;

      this.svgObj['legendSvg_' + ind] = this.legendContainer.append('svg')
        .attr('class', 'legendSvg_' + ind)
        .attr('width', this.config.width)
        .attr('height', _data.length * legendHeight)
        .append('g')
        .attr('transform', 'translate(' + 0 + ',' + 20 + ')');

      this.svgObj['legendGroup'] = this.svgObj['legendSvg_' + ind].selectAll('.legend')
        .data(_data, function (d) { return d.data.id; })
        .enter()
        .append('g');

        this.svgObj['legendGroup'].attr('class', 'legend')
        .attr('transform', function (d, i) {
          return 'translate(0,' + ((i * legendHeight)) + ')';
        });

        this.svgObj['legendGroup'].append('text')
        .attr('x', 14)
        .attr('y', 12)
        .text((d) => _.startCase(d.data.name))
        .attr('fill', (d, i) => 'grey')
        .attr('font-size', '13px');

        let tempWidth = 0, tempHeight = legendHeight;
        this.svgObj['legendGroup'].attr('transform', function(d, i) {
          const node = d3.select(this).select('text').node();
          const nodeWidth = d3.select(this).select('text').node().getComputedTextLength() + 20;
          const totalWidth = self.config.width - 10;
          let width = totalWidth - nodeWidth - tempWidth;
          tempWidth += nodeWidth;
          if (tempWidth > (self.config.width - 10)) {
            tempWidth += nodeWidth;
            width = totalWidth - nodeWidth;
            tempHeight += legendHeight;
          }
          return 'translate(' + width + ',' + tempHeight + ')';
        });

        this.svgObj['legendGroup'].append('rect')
          .attr('width', legendRectSize)
          .attr('height', legendRectSize)
          .attr('tabindex', 1)
          .attr('rx', 30)
          .attr('ry', 30)
          .style('fill', function (d) {
            let col = self.rootColor;
            if (!_.isEmpty(d.parent)) {
              col =  self.leaveNodeColors[d.data.name] !== undefined ? self.leaveNodeColors[d.data.name]  : self.svgObj['color'](d.x0);
            }
            return col;
          });
    }
  }

  drawTooltip() {
    if (this.showTooltip) {
      this.svgObj['tooltip-content'] = d3.select('.tooltip-content');
      if (this.svgObj['tooltip-content'].size() === 0) {
        this.svgObj['tooltip-content'] = d3.select('body').append('div')
          .attr('class', 'tooltip-content')
          .style('display', 'none');
      }
    }
  }

  createTooltip(obj: any) {
    const { self, data } = obj;
    let str = ''; const label = _.startCase(data.data.name);
    if (!_.isEmpty(data.parent) &&  !_.isEmpty(data.parent.data.name)) {
      str = `<label class='pull-left'>Parent Node: ${data.parent.data.name}</label> </br>`;
    }
    str += `<label class='pull-left'>${label}: ${data.value}</label> </br>`;
    const tooltip = d3.selectAll('.tooltip-content');
    const tipWidth = tooltip.node().clientWidth;
    const parentWidth = self.chartEl.nativeElement.parentElement.clientWidth + tipWidth;
    const pageX = d3.event.pageX > parentWidth ? (d3.event.pageX - tipWidth - 20) : d3.event.pageX + 10;
    tooltip.html(str)
      .style('left', (pageX) + 'px')
      .style('top', (d3.event.pageY - 12) + 'px');
  }

  addtitleCenter() {
    if (this.titleCenter) {
      const data  = this.svgObj['partition'](this.svgObj['root']).descendants();
      const count = _.filter(data, (d) => d.depth === 1).length;

      this.svgObj['svg'].append('text')
        .attr('class', 'title')
        .attr('text-anchor', 'middle')
        .attr('font-size', '14px')
        .attr('fill', '#333')
        .attr('y', 0)
        .text(`Total Node`);

      this.svgObj['svg'].append('text')
        .attr('class', 'title')
        .attr('text-anchor', 'middle')
        .attr('font-size', '14px')
        .attr('fill', '#333')
        .attr('y', 20)
        .text(`${count}`);

    }

  }
}
/*eslint-enable */
