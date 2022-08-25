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

import {Commons} from '../../services/commons.service';

export default class LineChartConstants {
  private readonly _scheduleInformation = [
    'executorCores',
    'runningTasks',
    'activeTasks',
    'taskFailures'
  ];
  private readonly _cpuUsageGc = [
    'sparkCoreUsage',
    'jvmGcUsage'
  ];
  private readonly _memoryUsage = [
    'executorTotalMemory',
    'storageMemory',
    'storageDiskUsed'
  ];
  private readonly _io = [
    'inputBytesRead',
    'outputBytesWritten',
    'externalBytesRead',
    'shuffleBytesRead',
    'externalBytesWritten',
    'shuffleBytesWritten'
  ];
  private readonly _timePerTask = ['time'];
  private readonly _sizePerPartition = ['size'];
  private readonly _keyPerPartition = ['key', 'value'];
  private readonly _colors = Commons.colors;
  private readonly _stackedColors = ['#348a7c', '#4d8eab', '#61b1a1', '#3D96AE'];
  private readonly _barChartFields = ['taskFailures'];

  get scheduleInformation() {
    return this._scheduleInformation;
  }

  get cpuUsageGc() {
    return this._cpuUsageGc;
  }

  get memoryUsage() {
    return this._memoryUsage;
  }

  get io() {
    return this._io;
  }

  get timePerTask() {
    return this._timePerTask;
  }

  get sizePerPartition() {
    return this._sizePerPartition;
  }

  get keyPerPartition() {
    return this._keyPerPartition;
  }

  get colors() {
    return this._colors;
  }

  get stackedColors() {
    return this._stackedColors;
  }

  get barChartFields() {
    return this._barChartFields;
  }

}
