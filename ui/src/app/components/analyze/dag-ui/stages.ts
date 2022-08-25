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
import {Commons, NumberString} from '../../../services/commons.service';

export class Stages {
  public static draw(self, stageRectsGroup, selectedItems) {
    let tooltip;
    const rects = stageRectsGroup.selectAll('rect')
      .data(selectedItems, function (d) {
        return d.id;
      })
      .attr('x', function (d) {
        return self.x2(d.start);
      })
      .attr('opacity', 1)
      .attr('width', function (d) {
        return self.x2(d.end) - self.x2(d.start);
      });
    rects.enter().append('rect')
      .attr('class', function (d) {
        let cls = 'item cursor-pointer';
        if (d.stageSucceeded === false) {
          cls += ' status-failed';
        }
        return cls;
      })
      .attr('id', function (d) {
        return d.id;
      });

    stageRectsGroup.selectAll('rect.item').attr('rx', '2')
      .attr('ry', '2')
      .attr('id', function (d) {
        return d.id;
      })
      .attr('x', function (d) {
        return self.x2(d.start);
      })
      .attr('y', function (d) {
        const i = self.stages.findIndex(o => o.stage === d.stage);
        return self.y1(i) + .1 * self.y1(1) + 2.5;
      })
      .attr('fill', function (d) {
        return d['isStatsAvailable'] === true ? 'url(' + location.pathname + '#gradient_' + d.id + ')' : '#aeaeae';
      })
      .attr('width', function (d) {
        return self.x2(d.end) - self.x2(d.start);
      })
      .attr('height', function () {
        return .8 * self.y1(1);
      })
      .on('click', (d) => self.showStageInfo(d));
      // .call(zoom);
    rects.exit().attr('opacity', 0);

    const externalDataItems = selectedItems.filter((stage) => {
      return ( stage.partitionToInputMetricBytesRead !== undefined );
    });

    const textIcon = stageRectsGroup.selectAll('text')
    .data(externalDataItems, function (d) {
      return d.id;
    })
    .attr('opacity', 0.5);

    textIcon.enter()
      .append('text')
      .attr('style', 'font-family:FontAwesome;')
      .attr('font-size', '12px')
      .attr('class', 'external-data-icon cursor-default')
      .merge(textIcon)
      .attr('x', function (d) {
        return self.x2(d.start) - 11;
      })
      .attr('y', function (d) {
        const i = self.stages.findIndex(o => o.stage === d.stage);
        return self.y1(i) + .1 * self.y1(1) + 20;
      })
      .text(function(d) { return '\uf0a9'; })
      .on('mouseover', function (d) {
        let inputMetricReadSize = '0';
        if (d.partitionToInputMetricBytesRead !== undefined) {
          inputMetricReadSize = Commons.formatBytes(d.inputBytesRead).toString();
        }
        tooltip = d3.selectAll('.tooltip-content');
        const str = `<div class="edge-tooltip">
                      <div><strong>Stage ${d.stage}</strong></div>
                      <div>External input size: ${inputMetricReadSize}</div>
                    </div>`;
        tooltip.html(str);
        tooltip.style('left', (d3.event.pageX - 60) + 'px');
        tooltip.style('top', (d3.event.pageY + 30) + 'px');
        tooltip.style('display', 'inline');
      }).on('mouseout', function () {
        tooltip.style('display', 'none');
      });
    textIcon.exit().attr('opacity', 0);
  }

  public static clearStages(stageRectsGroup) {
    stageRectsGroup.selectAll('rect').remove();
  }
}
/*eslint-enable */
