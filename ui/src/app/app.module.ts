import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { AppComponent } from './app.component';
import { AppService } from './app.service';
import { HttpClientModule } from '@angular/common/http';
import { RouteExampleComponent } from './route-example/route-example.component';
import { HeaderComponent } from './components/header/header.component';
import { FooterComponent } from './components/footer/footer.component';
import { SidenavComponent } from './components/sidenav/sidenav.component';
import {AngularFontAwesomeModule} from "angular-font-awesome";

const routes: Routes = [
  {
    path: 'scala',
    component: RouteExampleComponent,
    data: {technology: 'Scala'}
  },
  {
    path: 'play',
    component: RouteExampleComponent,
    data: {technology: 'Play'}
  },
  {
    path: 'angular',
    component: RouteExampleComponent,
    data: {technology: 'Angular'}
  },
  {
    path: '**',
    redirectTo: '/play',
    pathMatch: 'full'
  }
];

@NgModule({
  declarations: [
    AppComponent,
    RouteExampleComponent,
    HeaderComponent,
    FooterComponent,
    SidenavComponent
  ],
  imports: [
    BrowserModule,
    HttpClientModule,
    AngularFontAwesomeModule,
    RouterModule.forRoot(routes)
  ],
  providers: [AppService],
  bootstrap: [AppComponent]
})
export class AppModule {
}
