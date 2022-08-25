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

import {appRoutes} from './app.routes';
import {AppComponent, SafePipe} from './app.component';
import {AppService} from './app.service';
import {BrowserModule} from '@angular/platform-browser';
import {FormsModule} from '@angular/forms';
import {HttpClientModule} from '@angular/common/http';
import {NgModule} from '@angular/core';

import {FontAwesomeModule} from '@fortawesome/angular-fontawesome';
import {MomentModule} from 'ngx-moment';

import {
  AnalysisFailedMessageDialogComponent,
  AnalyzeComponent
} from './components/analyze/analyze.component';
import {AppInfoComponent} from './components/app-info/app-info.component';
import {BreadcrumbsComponent} from './components/breadcrumbs/breadcrumbs.component';
import {ConfigComponent} from './components/configuration/config.component';
import {ApplicationListingComponent} from './components/application-listing/application-listing.component';
import {DagUiComponent} from './components/analyze/dag-ui/dag-ui.component';
import {DesConfigComponent} from './components/des-config/des-config.component';
import {FooterComponent} from './components/footer/footer.component';
import {HeaderComponent} from './components/header/header.component';
import {JobAnalysisComponent} from './components/job-analysis/job-analysis.component';
import {NotebookComponent} from './components/notebook/notebook.component';
import {OutlierTasksComponent} from './components/job-analysis/outlier-tasks/outlier-tasks.component';
import {PartitionInfoComponent} from './components/analyze/dag-ui/stage-info/partition-info/partition-info.component';
import {ProgressBarComponent} from './components/job-analysis/progressbar/progress-bar.component';
import {SidenavComponent} from './components/sidenav/sidenav.component';
import {SqlPlanComponent} from './components/analyze/sql-plan/sql-plan.component';
import {SqlViewComponent} from './components/sql-view/sql-view.component';
import {StageInfoComponent} from './components/analyze/dag-ui/stage-info/stage-info.component';
import {DonutComponent} from './graph/donut/donut.component';
import {FlameChartComponent} from './graph/flame-chart/flame-chart.component';
import {LineChartComponent} from './graph/line-chart/line-chart.component';
import {InitcapPipe} from './pipe/initcap.pipe';
import {SearchFilterPipe} from './pipe/search-filter.pipe';
import {ParentChildMessagingService} from './services/parent-child-messaging.service';
import {BreadcrumbDataService} from './services/breadcrumb-data.service';
import {ScatterComponent} from './graph/scatter/scatter.component';

import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatSortModule } from '@angular/material/sort';
import { MatTableModule } from '@angular/material/table';
import { MatTabsModule } from '@angular/material/tabs';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatTooltipModule } from '@angular/material/tooltip';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {FailedTaskComponent} from './components/failed-task/failed-task.component';
import {SunBurstComponent} from './graph/sub-burst/sun-burst.component';
import {APP_BASE_HREF} from '@angular/common';

@NgModule({
  declarations: [
    AnalyzeComponent,
    AnalysisFailedMessageDialogComponent,
    AppComponent,
    AppInfoComponent,
    BreadcrumbsComponent,
    ConfigComponent,
    DagUiComponent,
    DesConfigComponent,
    DonutComponent,
    FlameChartComponent,
    FooterComponent,
    HeaderComponent,
    JobAnalysisComponent,
    LineChartComponent,
    ApplicationListingComponent,
    NotebookComponent,
    OutlierTasksComponent,
    PartitionInfoComponent,
    ProgressBarComponent,
    SidenavComponent,
    SqlPlanComponent,
    SqlPlanComponent,
    SqlViewComponent,
    FailedTaskComponent,
    SunBurstComponent,
    StageInfoComponent,
    InitcapPipe,
    SafePipe,
    SearchFilterPipe,
    FailedTaskComponent,
    SunBurstComponent,
    ScatterComponent
  ],
  entryComponents: [
    AnalysisFailedMessageDialogComponent
  ],
  imports: [
    appRoutes,
    BrowserAnimationsModule,
    BrowserModule,
    FontAwesomeModule,
    FormsModule,
    HttpClientModule,
    MatButtonModule,
    MatCheckboxModule,
    MatDialogModule,
    MatIconModule,
    MatInputModule,
    MatMenuModule,
    MatPaginatorModule,
    MatSidenavModule,
    MatSortModule,
    MatTableModule,
    MatTabsModule,
    MatToolbarModule,
    MatTooltipModule,
    MomentModule,
  ],
  providers: [
    [{provide: APP_BASE_HREF, useValue: '/safari/des'}],
    AppService,
    BreadcrumbDataService,
    ParentChildMessagingService
  ],
  bootstrap: [AppComponent]
})
export class AppModule {
}
