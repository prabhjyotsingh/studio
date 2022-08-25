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

import {Component, OnInit, ViewChild} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import {WebsocketEventsService} from '../../services/websocket-events.service';
import {BreadcrumbDataService} from '../../services/breadcrumb-data.service';
import {BaseUrlServiceService} from '../../services/base-url-service.service';

import {map} from 'rxjs/operators';

@Component({
  selector: 'des-des-config',
  templateUrl: './des-config.component.html',
  styleUrls: ['./des-config.component.css']
})
export class DesConfigComponent implements OnInit {

  @ViewChild(MatSort, { static: true }) sort: MatSort;

  public dataSource;
  public displayedColumns = ['key', 'value', 'comments'];
  public arrayOfConfig = [];
  public restartRequired = false;
  public restartActivated = false;

  private pingIntervalId;

  constructor(private websocketEventsService: WebsocketEventsService,
    private breadcrumbDataService: BreadcrumbDataService,
    private http: HttpClient,
    private baseUrlServiceService: BaseUrlServiceService) {
  }

  ngOnInit() {
    const that = this;
    this.http.get(this.baseUrlServiceService.getRestApiBase() + '/des_application_config').pipe(
      map(response => response)).subscribe(
      x => {
        that.genratedArrayFromConfig('', x['object']);
        that.updateArrayForStaleConfig(x['newConfig']);
        that.restartRequired = x['restartRequired'];
        that.setupDataSource(that.arrayOfConfig);
      }
    );
    this.breadcrumbDataService.onChange(this.generateBreadcrumbs());
  }

  showHide(element: any) {
    element['show'] = !element['show'];
    element['newValue'] = element['value'];
  }

  save(element: any) {
    const that = this;
    this.http.post(this.baseUrlServiceService.getRestApiBase() + '/update_config',
      {
        'key': element['key'],
        'value': element['newValue']
      }).pipe(
      map(response => response)).subscribe(
      x => {
        element['value'] = element['newValue'];
        that.showHide(element);
        that.restartRequired = true;
      }
    );
  }

  generateBreadcrumbs() {
    return [
      {
        label: 'Config',
        url: 'config'
      }
    ];
  }

  public inputValueChange(el) {
    const index = this.arrayOfConfig.findIndex((config) => config.key === el.key);
    if (el.value === el.newValue) {
      this.arrayOfConfig[index].btnActive = true;
    } else {
      this.arrayOfConfig[index].btnActive = false;
    }
  }

  restart() {
    this.restartRequired = false;
    this.restartActivated = true;
    this.http.get(this.baseUrlServiceService.getRestApiBase() + '/restart_server').subscribe(res => {
      this.pingIntervalId = setInterval(() => {
        this.http.get(this.baseUrlServiceService.getRestApiBase() + '/des_application_config')
        .subscribe(
          data => {},
          error => {
            if (error.status === 200) {
              clearInterval(this.pingIntervalId);
              window.location.reload();
            }
          }
        );
      }, 5000);
    });
  }

  private updateArrayForStaleConfig(config) {
    if (Object.keys(config).length !== 0) {
      const that = this;
      for (const key of Object.keys(config)) {
        const keyIndex = that.arrayOfConfig.findIndex(element => element.key === key);
        that.arrayOfConfig[keyIndex]['value'] = config[key];
        that.arrayOfConfig[keyIndex]['newValue'] = config[key];
      }
    }
  }

  private genratedArrayFromConfig(key, config) {
    const that = this;
    if (config['value']) {
      that.arrayOfConfig.push({
        'key': key,
        'value': config['value'].trim(),
        'newValue': config['value'].trim(),
        'comments': config['origin']['commentsOrNull'] !== undefined
          ? config['origin']['commentsOrNull'].join().trim() : '',
        'show': false,
        'btnActive': true
      });
    } else {
      if (key !== '') {
        key += '.';
      }
      for (const [k, v] of Object.entries(config)) {
        if (k !== 'origin') {
          that.genratedArrayFromConfig(key + k, v);
        }
      }
    }
  }

  private setupDataSource(data) {
    this.dataSource = new MatTableDataSource(data);
    this.dataSource.sort = this.sort;
  }

}
