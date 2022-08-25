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

import {EventEmitter, Injectable} from '@angular/core';
import {WebsocketEvent} from '../model/websocket-event';
import {BaseUrlServiceService} from './base-url-service.service';
import {Observable} from 'rxjs';
import {AppService} from '../app.service';

@Injectable({
  providedIn: 'root'
})
export class WebsocketEventsService {
  public websocketEvents$: EventEmitter<WebsocketEvent>;
  public webSocketReady;
  ws: WebSocket;
  maxNosOfRetry = 10;
  currentRetryAttempt = 0;
  tryingToReconnect = false;
  private pingIntervalId;

  constructor(
    private baseUrlServiceService: BaseUrlServiceService,
    private appService: AppService
  ) {
    const that = this;
    that.websocketEvents$ = new EventEmitter();
    that.webSocketReady = new Observable(observer => {
      that.checkWSReadyState(observer);
    });
    appService.getTicket().subscribe(
      x => {
        this.initWebSocket();
      }
    );
  }

  public sendNewEvent = (data) => this.ws.send(JSON.stringify(data));

  private checkWSReadyState(observer) {
    const that = this;
    if (that.currentRetryAttempt < that.maxNosOfRetry) {
      if (that.ws && that.ws.readyState === 1) {
        observer.next(true);
        observer.complete();

      } else {
        setTimeout(() => {
          that.checkWSReadyState(observer);
        }, 1000);
      }
    } else {
      observer.error();
    }
  }

  private initWebSocket() {
    const that = this;
    that.ws = new WebSocket(that.baseUrlServiceService.getWebSocketUrl());
    that.ws.onopen = () => {
      that.currentRetryAttempt = 0;
      that.tryingToReconnect = false;
      that.pingIntervalId = setInterval(() => {
        that.sendNewEvent({op: 'PING'});
      }, 10000);
    };

    that.ws.onclose = (event) => {
      console.log('close message: ', JSON.stringify(event));

      if (that.pingIntervalId !== undefined) {
        clearInterval(that.pingIntervalId);
        that.pingIntervalId = undefined;
      }
      that.tryingToReconnect = true;
      if (that.currentRetryAttempt < that.maxNosOfRetry && that.tryingToReconnect) {
        setTimeout(() => {
          that.currentRetryAttempt++;
          that.initWebSocket();
        }, that.reconnectAttemptDuration());
      }
    };

    that.ws.onerror = (event) => {
      console.log('error message: ', JSON.stringify(event));
      if (that.currentRetryAttempt < that.maxNosOfRetry && !that.tryingToReconnect) {
        setTimeout(() => {
          that.currentRetryAttempt++;
          that.initWebSocket();
        }, that.reconnectAttemptDuration());
      }
    };

    that.ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      switch (message.op) {
      case 'APP_LIST':
      case 'STAGE_DETAILS':
      case 'SQL_PLAN_UPDATES':
      case 'STAGE_ALERTS':
      case 'STAGE_ANOMALIES':
      case 'PARTITION_DATA':
      case 'APP_CONFIG':
      case 'MEMORY_OUTPUT':
      case 'CPU_USAGE':
        that.websocketEvents$.emit(new WebsocketEvent(message.op, JSON.parse(message.data.data)));
        break;
      case 'APP_DETAILS':
        const data = JSON.parse(message.data.data);
        data['analysis'] = message.data.analysis;
        that.websocketEvents$.emit(new WebsocketEvent(message.op, data));
        break;
      default:
        console.log(message);
      }
    };
  }

  private reconnectAttemptDuration = () => Math.pow(2, this.currentRetryAttempt) * 1000;

}
