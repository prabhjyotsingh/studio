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

import * as d3 from 'd3';

export class PartitionInfo {
  public static draw(self, itemRects, selectedItems) {
    const inputCircles = itemRects.selectAll('.input-circles')
      .data(selectedItems.filter((d) => d.partitionToInputBytes !== undefined))
      .attr('opacity', 1)
      .attr('cy', d => {
        const i = self.stages.findIndex(o => o.stage === d.stage);
        return self.y1(i) + 6;
      })
      .attr('cx', d => self.x2(d.start) + (self.x2(d.end) - self.x2(d.start)) / 2)
      .on('mouseover', (d) => PartitionInfo.show(d, 'input'));

    inputCircles.enter()
      .append('circle')
      .attr('class', 'input-circles');
    inputCircles.exit().attr('opacity', 0);

    const outputCircles = itemRects.selectAll('.output-circles')
      .data(selectedItems.filter((d) => d.partitionToOutputBytes !== undefined))
      .attr('opacity', 1)
      .attr('cy', d => {
        const i = self.stages.findIndex(o => o.stage === d.stage);
        return self.y1(i + 0.6);
      })
      .attr('cx', d => self.x2(d.end))
      .on('mouseover', (d) => PartitionInfo.show(d, 'output'));

    outputCircles.enter()
      .append('circle')
      .attr('class', 'output-circles');
    outputCircles.exit().attr('opacity', 0);

    d3.select('body').on('click', () => {
      d3.select('#partitionChart').property('scrollLeft', 0).attr('style', 'display:none');
      d3.select('#partitionChart svg').remove();
    });
  }

  private static show(d, type) {
    if (d3.select('#partitionChart svg').size() > 0) {
      return;
    }
    let partitionInfo;
    if (type === 'input') {
      partitionInfo = Object.values(d.partitionToInputBytes);
      d3.select('#partitionChartInfo').html('Partition to input bytes');
    } else {
      partitionInfo = Object.values(d.partitionToOutputBytes);
      d3.select('#partitionChartInfo').html('Partition to output bytes');
    }

    const width = Math.max(partitionInfo.length * 20, 500);
    const height = 200;

    const x = d3.scaleLinear()
      .range([0, width]);
    const y = d3.scaleLinear()
      .range([height, 0]);

    const svg = d3.select('#partitionChart')
      .attr('style', 'display:block;')
      .append('svg')
      .attr('width', width)
      .attr('height', height)
      .append('g');

    x.domain([0, d.numPartitions]);
    // eslint-disable-next-line @typescript-eslint/no-shadow
    y.domain([0, d3.max(partitionInfo, d => d)]);

    svg.append('g').selectAll('.bar')
      .data(partitionInfo)
      .enter().append('rect')
      .attr('class', 'bar')
      .attr('fill', '#1b8786')
      .attr('width', 15)
    // eslint-disable-next-line @typescript-eslint/no-shadow
      .attr('x', (d, i) => x(i))
    // eslint-disable-next-line @typescript-eslint/no-shadow
      .attr('y', d => y(d))
    // eslint-disable-next-line @typescript-eslint/no-shadow
      .attr('height', d => height - y(d));

    // TODO: fix labels
    // svg.append('g').selectAll('text')
    //   .data(partitionInfo)
    //   .enter().append('text')
    //   .attr('class', 'bar-label')
    //   .attr('transform', 'rotate(-90)')
    //   .attr('x', function (d, i) {
    //     return -y(d);
    //   })
    //   .attr('y', function (d, i) {
    //     return x(i);
    //   })
    //   .text(function(d) { return d; });

    svg.append('g')
      .attr('transform', 'translate(0,' + height + ')')
      .call(d3.axisBottom(x));

    svg.append('g')
      .call(d3.axisLeft(y).ticks(8));
  }
}
