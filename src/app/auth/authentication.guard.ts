import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { Observable } from 'rxjs';
import { AuthService } from '../auth/auth.service';

@Injectable()
export class AuthenticationGuard implements CanActivate {

  constructor(public authService: AuthService, public router: Router) {
  }

  canActivate(next: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> | Promise<boolean> | boolean {
    if (!this.authService.userCheckProcess) {
      if (next.routeConfig.path.includes('int/') && next.params.token !== localStorage.getItem('jwt_token')) {
        this.authService.logout(false);
        localStorage.setItem('jwt_token', next.params.token);
        return this.authService.checkIfUserLoggedIn().then(_ => {
          this.authService.onLogin.emit();
          return this.canActivate(next, state) as boolean;
        });
      } else if (!this.authService.isLoggedIn() && next.routeConfig.path !== 'login') {
        this.router.navigate(['/login']);
        return false;
      } else if (this.authService.isLoggedIn() && next.routeConfig.path === 'login') {
        this.router.navigate(['/']);
        return false;
      }
      return true;
    } else {
      return this.authService.userCheckProcess.then(_ => this.canActivate(next, state) as boolean);
    }
  }
}
