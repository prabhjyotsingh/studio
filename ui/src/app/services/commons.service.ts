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

import {Injectable} from '@angular/core';
import * as d3 from 'd3';
import * as _ from 'lodash';

export class NumberString {
  constructor(public num: number, public str: string) {
  }

  public toString() {
    return this.num + this.str;
  };
}

@Injectable({
  providedIn: 'root'
})
export class Commons {
  static colors: any = [
    '#AA4643',
    '#89A54E',
    '#80699B',
    '#3D96AE',
    '#DB843D',
    '#92A8CD',
    '#A47D7C',
    '#B5CA92',
    '#4572A7'
  ];

  static colorsScheme2: any = [
    '#7cb5ec',
    '#434348',
    '#90ed7d',
    '#f7a35c',
    '#8085e9',
    '#f15c80',
    '#e4d354',
    '#2b908f',
    '#f45b5b'
  ];

  constructor() {
  }

  static formatBytes(bytes: number, floatPoint: string = '.0f') {
    if (!bytes) {
      return new NumberString(0, 'B');
    }
    const fmt = d3.format(floatPoint);
    if (bytes < 1024) {
      return (new NumberString(fmt(bytes), 'B'));
    } else if (bytes < 1024 * 1024) {
      return (new NumberString(fmt(bytes / 1024), 'KB'));
    } else if (bytes < 1024 * 1024 * 1024) {
      return (new NumberString(fmt(bytes / 1024 / 1024), 'MB'));
    } else if (bytes < 1024 * 1024 * 1024 * 1024) {
      return (new NumberString(fmt(bytes / 1024 / 1024 / 1024), 'GB'));
    } else {
      return (new NumberString(fmt(bytes / 1024 / 1024 / 1024 / 1024), 'TB'));
    }
  };

  static formatTime(milliSec: number) {
    let val = milliSec || 0;
    let suffix = 'MS';
    if (val >= 1000) {
      val = val / 1000;
      suffix = 'SEC';
      if (val >= 60) {
        val = val / 60;
        suffix = 'MIN';
        if (val >= 60) {
          val = val / 60;
          suffix = 'HRS';
        }
      }
    }
    if (typeof val !== 'number') {
      const fmt = d3.format('.1f');
      const strVal = fmt(val);
      return new NumberString(parseFloat(strVal), suffix);
    } else {
      return new NumberString(parseFloat(val.toFixed(1)), suffix);
    }
  };

  static formatCount(milliSec: number) {
    let val = milliSec || 0; let suffix = '';
    if (val >= 1000) {
      val = val / 1000;
      suffix = 'K';
      if (val >= 1000) {
        val = val / 1000;
        suffix = 'M';
        if (val >= 1000) {
          val = val / 1000;
          suffix = 'B';
        }
      }
    }
    return new NumberString(val, suffix);
  };

  static getPartitionSize(partitions) {
    if (partitions !== undefined) {
      const p: Array<number> = Object.values(partitions);
      return p.reduce((accumulator, currentValue) => accumulator += currentValue);
    }
  }

  public static hexToRgb(hex, alpha) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (alpha === undefined) {
      alpha = 1;
    }
    return result ?
      'rgb(' + parseInt(result[1], 16) + ',' + parseInt(result[2], 16) + ',' + parseInt(result[3],
        16) + ',' + alpha + ')' :
      null;

  }

  public static darkenColor(color: string, percent: number): string {
    const col = (color.indexOf('#') >= 0) ? color.substring(1, color.length) : color;
    const per = ((255 * percent) / 100);
    const val1 = this.getShades(col.substring(0, 2), per);
    const val2 = this.getShades(col.substring(2, 4), per);
    const val3 = this.getShades(col.substring(4, 6), per);
    return `#${val1}${val2}${val3}`;
  }

  public static getShades(color: string, percent: number): string {
    const cc = parseInt(color, 16) - percent;
    const c = (cc < 0) ? 0 : (cc);
    return (c.toString(16).length > 1) ? c.toString(16) : `0${c.toString(16)}`;
  }

  public static getSentenceCase(str: string) {
    return _.chain(str).lowerCase().upperFirst().value();
  }

}
