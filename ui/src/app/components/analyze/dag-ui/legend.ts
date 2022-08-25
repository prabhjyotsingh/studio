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

export class Legend {
  public static draw(container, config, stageMetricColors) {
    const legendHeight = 18;
    let paddingTop = 0;
    const datum = [
      ['Task schedule wait time', stageMetricColors.wait],
      ['Compute time', stageMetricColors.computation],
      ['Overhead time', stageMetricColors.overhead],
      ['Unavailable', stageMetricColors.unavailable],
      ['Failed', stageMetricColors.failed]
     ];

    const legendGroup = container.append('svg')
      .attr('width', config.width + 70).attr('height', 50)
      .append('g')
      .attr('transform', 'translate(' + (120) + ', 5)');

    const legend = legendGroup.selectAll('.legend')
      .data(datum.reverse())
      .enter()
      .append('g')
      .attr('class', 'legend');

      legend.append('text')
        .attr('x', 15)
        .attr('y', 10)
        .attr('class', 'chart-title')
        .text((d) => d[0]);

      let tempWidth = 0;
      let tempHeight = legendHeight;
      legend.attr('transform', function() {
        const nodeWidth = this.children[0].getComputedTextLength() + 20;
        const totalWidth = config.width - 70;
        let width = totalWidth - nodeWidth - tempWidth;
        tempWidth += nodeWidth;
        if (tempWidth > (config.width - 50)) {
          tempWidth = 0;
          paddingTop = legendHeight;
          width = totalWidth - nodeWidth;
          tempHeight += legendHeight;
        }
        return 'translate(' + width + ',' + tempHeight + ')';
      });

      legendGroup.selectAll('.legend')
        .append('rect')
        .attr('width', 12)
        .attr('height', 12)
        .attr('rx', 2)
        .attr('ry', 2)
        .style('fill', (d) => d[1]);
  }
}
