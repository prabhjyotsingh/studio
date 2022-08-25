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

import {Commons} from '../../../services/commons.service';

export class StageMetricGradient {
  public static setup(defs, items, stageMetricColors, selectedStage) {
      items.forEach((item) => {
        if (!item.isStatsAvailable) {
          return;
        }

        const stats = item['stats'];
        const waitProportionPercentage = stats.waitProportionPercentage;
        const computeProportionPercentage = waitProportionPercentage + stats.computeProportionPercentage;
        const overheadProportionPercentage = computeProportionPercentage + stats.overheadProportionPercentage;

        let waitColor = stageMetricColors.wait;
        let computationColor = stageMetricColors.computation;
        let overheadColor = stageMetricColors.overhead;
        if (selectedStage === item) {
          waitColor = Commons.darkenColor(stageMetricColors.wait, 20);
          computationColor = Commons.darkenColor(stageMetricColors.computation, 20);
          overheadColor =  Commons.darkenColor(stageMetricColors.overhead, 20);
        }

        const gradient = defs
          .append('linearGradient')
          .attr('id', 'gradient_' + item.id);

        gradient.append('stop')
          .attr('offset', '0%')
          .attr('stop-color', waitColor);

        gradient.append('stop')
          .attr('offset', waitProportionPercentage + '%')
          .attr('stop-color', waitColor);

        gradient.append('stop')
          .attr('offset', waitProportionPercentage + '%')
          .attr('stop-color', computationColor);

        gradient.append('stop')
          .attr('offset', computeProportionPercentage + '%')
          .attr('stop-color', computationColor);

        gradient.append('stop')
          .attr('offset', computeProportionPercentage + '%')
          .attr('stop-color', computationColor);

        gradient.append('stop')
          .attr('offset', computeProportionPercentage + '%')
          .attr('stop-color', overheadColor);

        gradient.append('stop')
          .attr('offset', overheadProportionPercentage + '%')
          .attr('stop-color', overheadColor);

        gradient.append('stop')
          .attr('offset', overheadProportionPercentage + '%')
          .attr('stop-color', overheadColor);
      });
  }
}
