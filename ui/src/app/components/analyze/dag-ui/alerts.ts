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

export class Alerts {
  public static draw(self, data) {
    let alertGroup = self.containers.brush.select('g.alert-group');
    if (!alertGroup.node()) {
      alertGroup = self.containers.brush.append('g').classed('alert-group', true);
    }

    if (self.stages.length === 0) {
      return ;
    }

    const circles = alertGroup.selectAll('circle.alert-circle')
      .data(data);

    circles.exit().remove();

    circles.enter().append('circle')
      .attr('class', 'alert-circle');

    alertGroup.selectAll('circle.alert-circle').attr('r', 4)
    .attr('cy', 40)
    .attr('fill', '#f58231')
    .attr('opacity', '0.7')
    .attr('cx', d => self.x2(d.timestamp))
    .on('click', (d) => {
      if (self.analysisState === 'COMPLETED') {
        const thisStage = self.items.find((t) => t.stage === d.stageId);
        Alerts.hideTooltip();
        self.router.navigate(['job_analysis/stage', thisStage.stage], {relativeTo: self.route, queryParams: {tab: 2}});
      }
    })
    .on('mouseover', function(d) {
      if (self.analysisState === 'COMPLETED') {
        this.style.cursor = 'pointor';
      } else {
        this.style.cursor = 'default';
      }
      const tooltip = d3.selectAll('.tooltip-content');
      const str = `<label class='pull-left'><strong>Stage ${d.stageId}</strong></label><br>
                     <label class='pull-left'>${d.info}</label>`;
      tooltip.html(str);
      tooltip.style('left', (d3.event.pageX - 60) + 'px');
      tooltip.style('top', (d3.event.pageY + 30) + 'px');
      tooltip.style('display', 'inline');
    })
    .on('mouseout', () => {
      Alerts.hideTooltip();
    });
  }

  private static hideTooltip() {
    const tooltip = d3.selectAll('.tooltip-content');
    tooltip.style('display', 'none');
  }
}
