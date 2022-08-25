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
import {HttpClient} from '@angular/common/http';
import {map} from 'rxjs/operators';
import {BaseUrlServiceService} from './services/base-url-service.service';

/**
 * Class representing application service.
 *
 * @class AppService.
 */
@Injectable()
export class AppService {

  private readonly ticketObserver: EventEmitter<any>;
  private ticket;

  constructor(private http: HttpClient,
    private baseUrlServiceService: BaseUrlServiceService) {
    this.ticketObserver = new EventEmitter();

    if (this.ticket !== undefined && this.ticket['principal'] !== undefined) {
      this.ticketObserver.emit(this.ticket);
    } else {
      this.getServerTicker();
    }
  }

  public getTicket() {
    return this.ticketObserver;
  }

  private getServerTicker() {
    this.http.get(this.baseUrlServiceService.getRestApiBase() + '/ticket').subscribe(
      (x: any) => {
        this.ticket = x;
        this.ticketObserver.emit(this.ticket);
      }, e => {
        console.log('e', e);
        if (e.status === 404 && this.baseUrlServiceService.getPath() !== '') {
          this.baseUrlServiceService.setPath('');
          this.getServerTicker();
        }
        if (window.location.host === 'localhost:4200') {
          this.http.post(this.baseUrlServiceService.getBase() + '/login',
            {'email': 'admin', 'password': 'admin'}).pipe(
            map(response => response)).subscribe(
            x => {
              this.ticket = x;
              this.ticketObserver.emit(this.ticket);
            }
          );
        }
      }
    );
  }
}
