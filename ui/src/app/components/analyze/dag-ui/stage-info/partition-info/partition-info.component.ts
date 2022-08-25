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

import {Component, Input, OnChanges, OnInit, SimpleChanges, ViewEncapsulation} from '@angular/core';
import * as _ from 'lodash';

@Component({
  selector: 'des-partition-info',
  templateUrl: './partition-info.component.html',
  styleUrls: ['./partition-info.component.scss'],
  encapsulation: ViewEncapsulation.None
})

export class PartitionInfoComponent implements OnInit, OnChanges {
  @Input() stage: any;
  @Input() tabViewWidth;

  public chartWidth;
  public partitions: Array<PartitionsType> = [];

  private partitionList = [
    {key: 'Input', label: 'input distribution'},
    {key: 'Output', label: 'output distribution'}
  ];

  constructor() {
  }

  ngOnInit() {
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['stage'] && !_.isEmpty(this.stage) || (this.chartWidth !== this.tabViewWidth)) {
      this.getPartitionsFromStage();
    }
  }

  getPartitionsFromStage() {
    if (this.stage === undefined) {
      return;
    }
    this.partitions = [];
    _.map(this.partitionList, (pList) => {
      const d = this.stage[`partitionTo${pList.key}Bytes`];
      if (!_.isEmpty(d)) {
        const data: PartitionsData[] = [{
          name: pList.key + ', Partitions',
          values: Object.keys(d).map(key => ({
            time: Number.parseInt(key, 10),
            data: d[key]
          }))
        }];
        let label = '';
        if (pList['key'] === 'Input') {
          if (this.stage.partitionToInputMetricBytesRead !== undefined) {
            label = 'HDFS ' + pList.label;
          } else {
            label = 'Shuffle ' + pList.label;
          }
        } else {
          if (this.stage.partitionToOutputMetricBytesWritten !== undefined) {
            label = 'HDFS ' + pList.label;
          } else {
            label = 'Shuffle ' + pList.label;
          }
        }
        this.partitions.push({
          label,
          data
        });
      }
    });
    this.chartWidth = (this.tabViewWidth / 2) + 40;
  }
}

export interface PartitionsDataValue {
  data?: number;
  name?: string;
  time?: number;
}

export interface PartitionsData {
  name: string;
  values: PartitionsDataValue[];
}

export interface PartitionsType {
  label: string;
  data: PartitionsData[];
}
