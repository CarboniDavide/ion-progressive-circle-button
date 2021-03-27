import { NgModule, ModuleWithProviders } from '@angular/core';
import { IonProgressiveCircleButtonComponent } from './components/ion-progressive-circle-button.component';
import { IonProgressiveCircleButtonProvider } from './providers/ion-progressive-circle-button-provider';


@NgModule({
  declarations: [ IonProgressiveCircleButtonComponent ],
  exports: [ IonProgressiveCircleButtonComponent ]
})
export class IonProgressiveCircleButtonModule {
  static forRoot(): ModuleWithProviders {
    return {
      ngModule: IonProgressiveCircleButtonModule,
      providers: [ IonProgressiveCircleButtonProvider ]
    };
  }
 }
