import {Component, OnInit} from '@angular/core';
import {PreLoaderService} from "../../services/pre-loader.service";
import jQuery from "jquery";

@Component({
  selector: 'app-sidenav',
  templateUrl: './sidenav.component.html',
  styleUrls: ['./sidenav.component.css']
})
export class SidenavComponent implements OnInit {

  private isCollapsed: Boolean = false;

  constructor() {
  }

  ngOnInit() {
    PreLoaderService.hidePreLoader();

  }

  toggleSideNavigation() {
    if (this.isCollapsed) {
      jQuery('.sidenav').removeClass('collpased');
      jQuery('.expander > i').addClass('fa-angle-double-left').removeClass('fa-angle-double-right');
      jQuery('.main').addClass('maximised').removeClass('minimized');

    } else {
      jQuery('.sidenav').addClass('collpased');
      jQuery('.expander > i').removeClass('fa-angle-double-left').addClass('fa-angle-double-right');
      jQuery('.main').addClass('minimized').removeClass('maximised');
    }
    this.isCollapsed = !this.isCollapsed;
  }
}
