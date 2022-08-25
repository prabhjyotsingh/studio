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

import {
  Component,
  EventEmitter,
  HostListener,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges,
  ViewChild,
  ViewEncapsulation
} from '@angular/core';
import {Commons} from '../../../../services/commons.service';
import {Subject} from 'rxjs';
import {debounceTime} from 'rxjs/operators';
import {ParentChildMessagingService} from '../../../../services/parent-child-messaging.service';

@Component({
  selector: 'des-stage-info',
  templateUrl: './stage-info.component.html',
  styleUrls: ['./stage-info.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class StageInfoComponent implements OnInit, OnChanges {
  @Input() sqlPlanUpdates;
  @Input() selectedStage;
  @Input() analysisState;
  @Output() messageEvent = new EventEmitter();
  @Input() stageAnlaysis = true;
  @ViewChild('sqlPlanFragment', { static: true }) sqlPlanComponent;
  @ViewChild('tabView', { static: true }) tabView;

  public inputSize: string;
  public outputSize: string;
  public inputMetricReadSize: string;
  public outputMetricWrittenSize: string;
  public tabViewWidth;
  private resizeSubject = new Subject<number>();
  private resizeObservable = this.resizeSubject.asObservable().pipe(debounceTime(500));
  private floatPoint = '0.1f';
  private tabIndex = 0;

  constructor(private parentChildMessagingService: ParentChildMessagingService) {
  }

  @HostListener('window:resize', ['$event.target.innerWidth'])
  onResize(width: number) {
    this.setTabViewWidth();
  }

  ngOnInit() {
    this.setTabViewWidth();
    this.resizeObservable.subscribe(() => {
      this.setTabViewWidth();
    });

    this.parentChildMessagingService.on('sidebar-toggle').subscribe(() => {
      this.setTabViewWidth();
    });
  }

  setTabViewWidth() {
    this.tabViewWidth = this.tabView.nativeElement.clientWidth;
  }

  ngOnChanges(changes: SimpleChanges) {
    if (this.selectedStage.partitionToInputMetricBytesRead !== undefined) {
      this.inputSize = '0';
      this.inputMetricReadSize = Commons.formatBytes(this.selectedStage.inputBytesRead,
        this.floatPoint).toString();
    } else {
      this.inputSize = Commons.formatBytes(this.selectedStage.inputBytesRead,
        this.floatPoint).toString();
      this.inputMetricReadSize = '0';
    }

    if (this.selectedStage.partitionToOutputMetricBytesWritten !== undefined) {
      this.outputSize = '0';
      this.outputMetricWrittenSize = Commons.formatBytes(this.selectedStage.outputBytesWritten,
        this.floatPoint).toString();
    } else {
      this.outputSize = Commons.formatBytes(this.selectedStage.outputBytesWritten,
        this.floatPoint).toString();
      this.outputMetricWrittenSize = '0';
    }

    if (this.selectedStage.duration === undefined) {
      const duration = Commons.formatTime(
        this.selectedStage.endTime - this.selectedStage.startTime);
      this.selectedStage.duration = duration.toString();
    }

    if (this.tabIndex === 1) {
      this.renderFragment();
    }
  }

  closeInfo() {
    this.messageEvent.emit('close');
  }

  public selectedTabChangeHandler(tab) {
    if (tab.index === 1) {
      this.tabViewWidth = this.tabView.nativeElement.clientWidth;
      this.renderFragment();
    }
    this.tabIndex = tab.index;
  }

  public renderFragment() {
    setTimeout(() => {
      this.sqlPlanComponent.renderFragment(this.selectedStage.stage);
    }, 1);
  }
}
