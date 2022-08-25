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

import _ from 'lodash';
import * as d3 from 'd3';
import * as dagreD3 from 'dagre-d3';
import {Component, ElementRef, EventEmitter, Input, OnInit, Output, ViewEncapsulation} from '@angular/core';

@Component({
  selector: 'des-sql-plan',
  templateUrl: './sql-plan.component.html',
  styleUrls: ['./sql-plan.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class SqlPlanComponent implements OnInit {
  @Input() sqlPlanUpdates;
  @Output() messageEvent = new EventEmitter();

  public selectedPlanId;
  public selectedStageId;

  private config = {
    width: window.innerWidth - 600,
  };

  constructor(private element: ElementRef) {
  }

  ngOnInit() {
  }

  private renderFragment(stageId) {
    this.selectedStageId = stageId;
    const data = this.getSqlFragment(stageId);
    this.render(data);
  }

  private getSqlFragment(stageId): any {
    if (this.sqlPlanUpdates === undefined || this.sqlPlanUpdates === null) {
      return;
    }
    const sqlPlanUpdates = Object.values(this.sqlPlanUpdates);
    for (const items of sqlPlanUpdates) {
      const obj = [];
      for (const itemKey in items as Array<any>) {
        if (items.hasOwnProperty(itemKey)) {
          if (items[itemKey]['stageIds'] && items[itemKey]['stageIds'].findIndex(id => id === stageId) !== -1) {
            obj.push(items[itemKey]);
          }
        }
      }
      if (obj.length > 0) {
        return obj;
      }
    }
  }

  private renderPlan(planId) {
    if (_.isEmpty(this.sqlPlanUpdates) || _.isEmpty(this.sqlPlanUpdates[planId])) {
      return;
    }
    this.selectedPlanId = planId;
    const data = this.sqlPlanUpdates[planId];
    this.render(data);
  }

  private render(data) {
    const element = this.element.nativeElement.id;
    const g = new dagreD3.graphlib.Graph({compound: true}).setGraph({});
    const render = new dagreD3.render();
    const svg = d3.select('#' + element + ' > svg');

    svg.select('g').remove();
    const inner = svg.append('g');

    if (data) {
      for (const node of data) {
        const value = node;
        value.label = node.nodeName;
        g.setNode(node.id, value);
        g.setNode('stage_' + node.stageIds.toString(), {label: 'Stage ' + node.stageIds.toString(), clusterLabelPos: 'top'});

        g.setParent(node.id, 'stage_' + node.stageIds.toString());

        if (!_.isEmpty(node['parents'])) {
          for (const parentId of node['parents']) {
            const parent = data.filter((p) => p.id === parentId)[0];
            if (parent && parent.id) {
              g.setEdge(parent.id, value.id, {});
            }
          }
        }
      }
      g.graph().rankDir = 'LR';
      render(inner, g);
      svg.selectAll('rect').attr('rx', '3').attr('ry', '3');

      const zoom = d3.zoom()
        .on('zoom', () => {
          inner.attr('transform', d3.event.transform);
        });
      svg.call(zoom);
      svg.transition().duration(500).call(zoom.transform, d3.zoomIdentity);
    } else {
      inner.append('text')
        .attr('x', 10)
        .attr('font-size', '14px')
        .attr('color', '#b4b4b4')
        .attr('y', 40)
        .text('SQL plan not available for Stage ' + this.selectedStageId);
    }
  }
}
