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

import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { OutlierTasksComponent } from './outlier-tasks.component';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTooltipModule } from '@angular/material/tooltip';
import {FlameChartComponent} from '../../../graph/flame-chart/flame-chart.component';
import {ScatterComponent} from '../../../graph/scatter/scatter.component';
import {AppService} from '../../../app.service';
import {PartitionInfoComponent} from '../../analyze/dag-ui/stage-info/partition-info/partition-info.component';
import {RouterTestingModule} from '@angular/router/testing';
import {StageInfoComponent} from '../../analyze/dag-ui/stage-info/stage-info.component';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {ParentChildMessagingService} from '../../../services/parent-child-messaging.service';
import {BreadcrumbDataService} from '../../../services/breadcrumb-data.service';
import {SqlPlanComponent} from '../../analyze/sql-plan/sql-plan.component';
import {HttpClientTestingModule} from '@angular/common/http/testing';

describe('OutlierTasksComponent', () => {
  let component: OutlierTasksComponent;
  let fixture: ComponentFixture<OutlierTasksComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ OutlierTasksComponent, StageInfoComponent, FlameChartComponent, ScatterComponent,
        PartitionInfoComponent, SqlPlanComponent ],
      providers: [AppService, ParentChildMessagingService, BreadcrumbDataService, MatDialog],
      imports: [ MatSidenavModule, RouterTestingModule, MatIconModule, MatMenuModule, HttpClientTestingModule,
        BrowserAnimationsModule, MatTooltipModule, MatDialogModule, MatTabsModule, MatTableModule, MatPaginatorModule, MatFormFieldModule ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(OutlierTasksComponent);
    component = fixture.componentInstance;
    component.dataSource = new MatTableDataSource();
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
