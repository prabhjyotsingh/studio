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

import {RouterModule, Routes} from '@angular/router';
import {ModuleWithProviders} from '@angular/core';
import {AnalyzeComponent} from './components/analyze/analyze.component';
import {ConfigComponent} from './components/configuration/config.component';
import {DesConfigComponent} from './components/des-config/des-config.component';
import {JobAnalysisComponent} from './components/job-analysis/job-analysis.component';
import {ApplicationListingComponent} from './components/application-listing/application-listing.component';
import {NotebookComponent} from './components/notebook/notebook.component';
import {SqlViewComponent} from './components/sql-view/sql-view.component';
import {FailedTaskComponent} from './components/failed-task/failed-task.component';

const routes: Routes = [
  {
    path: 'applications',
    component: ApplicationListingComponent
  },
  {
    path: 'application/:appId',
    component: AnalyzeComponent
  },
  {
    path: 'application/:appId/job-analysis/stage/:stageId',
    component: JobAnalysisComponent
  },
  {
    path: 'notebook',
    component: NotebookComponent
  },
  {
    path: 'application/:appId/config',
    component: ConfigComponent
  },
  {
    path: 'application/:appId/sql-view/:planId',
    component: SqlViewComponent
  },
  {
    path: 'failed-task/:appId',
    component: FailedTaskComponent
  },
  {
    path: 'config',
    component: DesConfigComponent
  },
  {
    path: 'failed-task/:appId',
    component: FailedTaskComponent
  },
  {
    path: '',
    redirectTo: 'applications',
    pathMatch: 'full'
  },
  {
    path: '**',
    redirectTo: 'applications'
  }
];

export const appRoutes: ModuleWithProviders<RouterModule> = RouterModule.forRoot(routes, { relativeLinkResolution: 'legacy' });
