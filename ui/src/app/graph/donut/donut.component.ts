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
import { Component, Input, OnInit, ElementRef, OnChanges, SimpleChanges, ViewChild } from '@angular/core';
import * as d3 from 'd3';
import * as _ from 'lodash';

@Component({
  selector: 'des-donut',
  templateUrl: './donut.component.html',
  styleUrls: ['./donut.component.scss']
})
export class DonutComponent implements OnInit, OnChanges {
  @Input() datum: Array<any> = [];
  @Input() showLegend = false;
  @Input() colors: Array<string> = [];
  @Input() innerRadius: number;
  @Input() textOnPie = false;
  @Input() graphWidth: number;
  @Input() pieCaption: string;
  @Input() pieSubCaption: string;
  @Input() showTooltip = false;
  @Input() sectionGap = 0.0;

  @ViewChild('pieChart', { static: true }) pieChartEl;
  @ViewChild('pieLegend', { static: true }) pieLegendEl;
  @ViewChild('chartWrapper', { static: true }) chartWrapper;

  private pieContainer;
  private legendContainer;
  private config = {
    width: 160,
    height: 160
  };
  private svgObj = {};
  private hidePieSection = new Map();
  private colorMap = new Map();
  private filteredData = [];


  constructor() { }

  ngOnInit() {
    if (this.datum.length === 0) {
      this.init();
      this.renderGraph();
    }
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['datum'] && this.datum.length > 0) {
      this.init();
      this.cleanUpChart();
      this.renderGraph();
    }
  }

  init() {
    this.setWidth();
    this.pieContainer = d3.select(this.pieChartEl.nativeElement);
  }

  cleanUpChart() {
    if (this.legendContainer && this.legendContainer.node()) {
      const legendNode = this.legendContainer.node();
      legendNode.style.width = '0px';
      legendNode.innerHTML = '';
    }
    this.pieContainer.node().innerHTML = '';
  }

  setWidth() {
    this.chartWrapper.nativeElement.style.width = this.config.width;
    // this.chartWrapper.nativeElement.style.marginTop = '15px';
    if (this.showLegend) {
      this.chartWrapper.nativeElement.style.width = (this.config.width * 2) + 10 + 'px';
      this.legendContainer = d3.select(this.pieLegendEl.nativeElement);
      this.legendContainer.node().style.width = this.config.width - 30 + 'px';
    }
  }

  renderGraph() {
    this.buildSvg();
    this.createPie();
    this.createArc();
    this.createPath();
    this.addTextOnPath();
    this.addTextCenter();
    this.addLegend();
    this.drawTooltip();
  }

  createPie() {
    this.svgObj['pie'] = d3.pie()
      .value(function (d) { return d.value; })
      .sort(null)
      .padAngle(this.sectionGap);
  }

  createArc() {
    let radius = this.config.width / 3;
    if (_.isUndefined(this.innerRadius) || _.isEmpty(this.innerRadius)) {
      radius = this.innerRadius;
    }
    this.svgObj['arc'] = d3.arc()
      .outerRadius(this.config.width / 2 - 10)
      .innerRadius(radius);

    this.svgObj['arcOver'] = d3.arc()
      .outerRadius(this.config.width / 2 - 5)
      .innerRadius(radius);
  }

  buildSvg() {
    let col = this.colors;
    if (_.isUndefined(this.colors) || _.isEmpty(this.colors)) {
      col = d3.schemeCategory10;
    }
    if (!_.isUndefined(this.graphWidth) || !_.isEmpty(this.graphWidth)) {
      this.config.height = this.config.width = this.graphWidth;
    }
    _.map(this.datum, (d, i) => this.colorMap.set(d, col[i]));

    this.svgObj['svg'] = this.pieContainer.append('svg')
      .style('width', this.config.width + 'px')
      .style('height', this.config.height + 'px')
      .attr('class', 'svg')
      .append('g')
      .attr('transform', 'translate(' + this.config.width / 2 + ',' + this.config.height / 2 + ')');
  }

  createPath() {
    const self = this;
    this.filteredData = _.filter(this.datum, (d) => !this.hidePieSection.has(d));
    this.addPath(this.filteredData);

    this.animatePath();

    if (this.datum.length === 0) {
      const obj = { name: '', value: 1 };
      this.colorMap.set(obj, '#efefef');
      this.addPath([obj]);
      this.animatePath();
    }
  }

  addPath(data) {
    const self = this;
    this.svgObj['path'] = this.svgObj['svg'].selectAll('path')
      .data(this.svgObj['pie'](data))
      .enter().append('path')
      .attr('d', this.svgObj['arc'])
      .attr('fill', (d, i) => {
        return self.colorMap.get(d.data);
      })
      .on('mouseover', function (d) {
        self.scaleArc.call(this, { self, arcType: 'arcOver' });
        if (self.showTooltip) {
          self.svgObj['tooltip-content'].style('display', 'inline');
        }
      })
      .on('mouseout', function (d) {
        self.scaleArc.call(this, { self, arcType: 'arc' });
        if (self.showTooltip) {
          self.svgObj['tooltip-content'].style('display', 'none');
        }
      })
      .on('mousemove', function (d) {
        if (self.showTooltip) {
          self.createTooltip.call(this, { self, data: d });
        }
      });
  }

  scaleArc(obj) {
    const self = obj.self;
    const arcType = obj.arcType;
    if (self.datum.length > 0) {
      d3.select(this)
        .transition()
        .duration(500)
        .attr('d', self.svgObj[arcType]);
    }
  }

  animatePath() {
    const self = this;
    this.svgObj['path'].transition()
      .duration(1000)
      .attrTween('d', function (d) {
        const interpolate = d3.interpolate({ startAngle: 0, endAngle: 0 }, d);
        return function (t, d) {
          const tt = self.hidePieSection.has(d) ? 0 : t;
          return self.svgObj['arc'](interpolate(tt));
        };
      });
  }

  addTextOnPath() {
    if (this.textOnPie) {
      const self = this;
      setTimeout(() => {
        const text = self.svgObj['svg'].selectAll('.text-label')
          .data(this.svgObj['pie'](self.filteredData))
          .enter()
          .append('text')
          .attr('class', 'text-label')
          .transition()
          .duration(500)
          .attr('transform', (d) => {
            return 'translate(' + self.svgObj['arc'].centroid(d) + ')';
          })
          .attr('dy', '.4em')
          .attr('text-anchor', 'middle')
          .text(function (d) {
            return self.hidePieSection.has(d) ? '' : d.value + '%';
          })
          .attr('fill', '#fff')
          .attr('font-size', '10px');
      }, 1000);
    }
  }

  addTextCenter() {
    if (this.pieCaption) {
      this.svgObj['svg'].append('text')
        .attr('class', 'pie-center-caption')
        .attr('text-anchor', 'middle')
        .attr('font-size', '36px')
        .attr('y', this.pieSubCaption ? 0 : 12)
        .text(this.pieCaption);
    }
    if (this.pieSubCaption) {
      this.svgObj['svg'].append('text')
        .attr('class', 'pie-center-subcaption')
        .attr('text-anchor', 'middle')
        .attr('font-size', '14px')
        .attr('y', this.pieCaption ? 20 : 5)
        .text(this.pieSubCaption);
    }
  }

  addLegend() {
    if (this.showLegend) {
      const legendRectSize = 12;
      const legendSpacing = 7;
      const legendHeight = legendRectSize + legendSpacing;

      this.svgObj['legendSvg'] = this.legendContainer.append('svg')
        .attr('class', 'legendSvg')
        .append('g')
        .attr('transform', 'translate(' + 80 + ',' + 0 + ')');

      this.svgObj['legendGroup'] = this.svgObj['legendSvg'].selectAll('.legend')
        .data(this.datum)
        .enter()
        .append('g');

      this.svgObj['legendGroup'].attr('class', 'legend')
        .attr('transform', function (d, i) {
          return 'translate(0,' + ((i * legendHeight) + 10) + ')';
        });

      this.svgObj['legendGroup'].append('rect')
        .attr('width', legendRectSize)
        .attr('height', legendRectSize)
        .attr('tabindex', 1)
        .attr('rx', 30)
        .attr('ry', 30)
        .attr('fill', (d, i) => this.colorMap.get(d))
        .attr('stroke', (d, i) => this.colorMap.get(d))
        .attr('cursor', 'pointer')
        .attr('opacity', (d) => this.hidePieSection.has(d) ? 0.4 : 1)
        .on('click', (d) => {
          this.handleLegendClick(d);
        });

      this.svgObj['legendGroup'].append('text')
        .attr('x', 30)
        .attr('y', 12)
        .text((d) => _.startCase(d.name))
        .attr('fill', (d, i) => 'grey')
        .attr('font-size', '13px')
        .attr('cursor', 'pointer')
        .attr('opacity', (d) => this.hidePieSection.has(d) ? 0.4 : 1)
        .on('click', (d) => {
          this.handleLegendClick(d);
        });
    }
  }

  handleLegendClick(d) {
    const oldSize = this.hidePieSection.size;
    if (this.hidePieSection.has(d)) {
      this.hidePieSection.delete(d);
    } else if (this.hidePieSection.size < (this.datum.length - 1)) {
      this.hidePieSection.set(d, d);
    }
    if (this.hidePieSection.size < this.datum.length && oldSize !== this.hidePieSection.size) {
      this.pieContainer.select('svg').remove();
      this.legendContainer.select('svg').remove();
      this.renderGraph();
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
    const self = obj.self;
    const data = obj.data;
    const label = data.data.name;
    const str = `<label class='pull-left'>${label}: ${data.value}</label> </br>`;
    const tooltip = d3.selectAll('.tooltip-content');
    const tipWidth = tooltip.node().clientWidth;
    const parentWidth = self.pieChartEl.nativeElement.parentElement.clientWidth + tipWidth;
    const pageX = d3.event.pageX > parentWidth ? (d3.event.pageX - tipWidth - 20) : d3.event.pageX + 10;
    tooltip.html(str)
      .style('left', (pageX) + 'px')
      .style('top', (d3.event.pageY - 12) + 'px');
  }
}
/*eslint-enable */
