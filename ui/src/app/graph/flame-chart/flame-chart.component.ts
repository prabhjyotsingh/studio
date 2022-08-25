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

import {Component, Input, OnInit, AfterViewChecked, OnDestroy} from '@angular/core';
import {DomSanitizer, SafeHtml} from '@angular/platform-browser';
import {BaseUrlServiceService} from '../../services/base-url-service.service';

@Component({
  selector: 'des-flame-chart',
  templateUrl: './flame-chart.component.html',
  styleUrls: ['./flame-chart.component.scss']
})

export class FlameChartComponent implements OnInit, AfterViewChecked, OnDestroy {
  @Input() svgMap;
  url: SafeHtml;
  public flameChartSelector;
  public hasSVG = true;

  constructor(private sanitizer: DomSanitizer, private baseUrlServiceService: BaseUrlServiceService) {
  }

  ngOnInit() {
    if (this.svgMap.taskId === undefined) {
      this.url = this.sanitizer.bypassSecurityTrustResourceUrl(
        this.baseUrlServiceService.getRestApiBase() +
        '/getStageSVG.svg?appIdReq=' + this.svgMap.appId +
        '&stageNameReq=' + this.svgMap.stageName);
    } else {
      this.url = this.sanitizer.bypassSecurityTrustResourceUrl(
        this.baseUrlServiceService.getRestApiBase() +
        '/getStageTaskSVG.svg?appIdReq=' + this.svgMap.appId +
        '&stageNameReq=' + this.svgMap.stageName +
        '&taskIdReq=' + this.svgMap.taskId);
    }
    this.flameChartSelector = '#flame-chart-' + (this.svgMap.taskId ? this.svgMap.taskId : '');
  }
  ngAfterViewChecked() {
    const element =  document.querySelector(this.flameChartSelector);
    if (element) {
      element.addEventListener('load', this.onSVGLoad, true);
    }
  }

  onSVGLoad(e) {
    e.target.classList = '';
    e.target.classList.add('width-100');
    e.target.nextElementSibling.style.display = 'none';

    const flameChartDocument = e.currentTarget.contentDocument;
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    const alertEl = <HTMLElement>e.target.parentElement.querySelector('#flameChartAlert');
    if (flameChartDocument && !flameChartDocument.querySelector('svg')) {
      alertEl.style.display = 'block';
      e.target.style.height = '0px';
    } else {
      alertEl.style.display = 'none';
      e.target.style.height = 'auto';
    }
  }

  ngOnDestroy() {
    this.flameChartSelector = '#flame-chart-' + (this.svgMap.taskId ? this.svgMap.taskId : '');
    document.querySelector(this.flameChartSelector).removeEventListener('load', this.onSVGLoad, true);
  }
}
