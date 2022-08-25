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
import * as _ from 'lodash';

export class Edges {
  public static draw(self, itemRects, vertexPairs, broadcastVertexPairs) {
    let tooltip;
    const edges = itemRects.selectAll('.edge')
      .data(vertexPairs)
      .attr('opacity', 0.7)
      .attr('d', function (d) {
        return  Edges.createEdge(self, d);
      });

    edges.enter().append('path')
      .attr('class', 'edge')
      .attr('stroke-width', function (d) {
        const numberString: NumberString = Edges.getAggregatedBytes(d);
        return Edges.getEdgeWidth(numberString) + 'px';
      })
      .attr('id', function (d) {
        return 'link_'
          + d.source.stage + '_' + d.target.stage + '_'
          + d.source.attemptId + '_' + d.target.attemptId;
      })
      .on('mouseover', function (d) {
        const sourceOutput = Commons.formatBytes(Commons.getPartitionSize(d.source.partitionToOutputBytes));

        tooltip = d3.selectAll('.tooltip-content');
        const str = `<div class="edge-tooltip">
                       <div>Stage ${d.source.stage} &rarr; Stage ${d.target.stage}</div>
                       <hr />
                       <div>Output size: ${sourceOutput}</div>
                     </div>`;
        tooltip.html(str);
        tooltip.style('left', (d3.event.pageX - 60) + 'px');
        tooltip.style('top', (d3.event.pageY + 30) + 'px');
        tooltip.style('display', 'inline');
      }).on('mouseout', function () {
        tooltip.style('display', 'none');
    });

    edges.exit().attr('opacity', 0);

    const broadcast = itemRects.selectAll('.broadcast-edge')
      .data(broadcastVertexPairs)
      .attr('opacity', 0.7)
      .attr('d', function (d) {
        return  Edges.createEdge(self, d);
      });

    broadcast.enter().append('path')
      .attr('class', 'broadcast-edge')
      .attr('id', function (d) {
        return 'broadcast_'
          + d.source.stage + '_' + d.target.stage;
      }).on('mouseover', function (d) {
      const sourceOutput = Commons.formatBytes(Commons.getPartitionSize(d.source.partitionToOutputBytes));

      tooltip = d3.selectAll('.tooltip-content');
      const str = `<div class="edge-tooltip">
                       <div>Stage ${d.source.stage} &rarr; Stage ${d.target.stage}</div>
                       <hr />
                       <div>Output size: ${sourceOutput}</div>
                     </div>`;
      tooltip.html(str);
      tooltip.style('left', (d3.event.pageX - 60) + 'px');
      tooltip.style('top', (d3.event.pageY + 30) + 'px');
      tooltip.style('display', 'inline');
    }).on('mouseout', function () {
      tooltip.style('display', 'none');

    broadcast.exit().attr('opacity', 0);
    });
  }

  private static createEdge(self, d) {
    const source = {
      x: self.x2(d.source.start) + (self.x2(d.source.end) - self.x2(d.source.start)) - 1,
      y: self.y1(d.source.laneIndex) + (self.y1(1.2) / 2)
    };
    const target = {
      x: self.x2(d.target.start) + (self.x2(d.target.end) - self.x2(d.target.start)) / 2,
      y: self.y1(d.target.laneIndex) + 6
    };
    return 'M' + source.x + ',' + source.y
      + 'L' + target.x + ',' + source.y
      + ' ' + target.x + ',' + target.y;
  }

  private static getAggregatedBytes(d): NumberString {
    return Commons.formatBytes(Commons.getPartitionSize(d['source']['partitionToOutputBytes']));
  }

  private static getEdgeWidth(numberString: NumberString): number {
    switch (numberString.str) {
      case 'B':
      case 'KB':
      case 'MB':
        return 1.5;
      case 'GB':
        if (numberString.num <= 10) {
          return 3;
        } else if (numberString.num > 10 && numberString.num <= 100) {
          return 4;
        } else {
          return 5;
        }
      case 'TB':
        return 6;
      default:
        return 1.5;
    }
  }
}
/*eslint-enable */
