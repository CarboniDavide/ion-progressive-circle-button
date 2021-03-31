import { AfterViewInit, Component, ElementRef, EventEmitter, Input, OnInit, Output, Renderer2 } from '@angular/core';
import { DomController, Platform } from '@ionic/angular';

@Component({
  selector: 'ion-progressive-circle-button',
  templateUrl: './ion-progressive-circle-button.component.html',
  styleUrls: ['./ion-progressive-circle-button.component.scss'],
})
export class IonProgressiveCircleButtonComponent implements AfterViewInit, OnInit {

  readonly USE_SHADOW: boolean = true;                               // use shadow css style          
  readonly REVERSE_ANIM: boolean = true;                             // reverese animation after stroke bar is charge is complete    
  readonly DISABLED: boolean = false;                                 // disable button
  readonly START_AT: number = 0;                                      // start stroke point animation in deg  
  readonly END_AT: number = 360;                                      // stop stroke point animation in deg
  readonly REDUCE_RADIUS: number = 24;                                // reduced radius for animation in % (1..100)
  readonly RADIUS_ANIMATION_DURATION: number = 0.2;                   // reduce circle animationduration in seconds
  readonly RADIUS_ANIMATION: string = "ease-in-out";                  // reduce circle animation type
  readonly COLOR: any = "black"                                       // circle color
  readonly ICON_COLOR: any ="white";                                  // icon color
  readonly DISABLED_COLOR: any = "lightgray";                         // circle color disabled      
  readonly SIZE: any = "100%";                                        // size of circle
  readonly STROKE_PP_SIZE: number = 16;                               // stroke size in % (1..100)
  readonly STROKE_PP_RADIUS: number = 92;                             // stroke radius in % (1..100)
  readonly STROKE_COLOR: any = this.COLOR;                            // stroke color 
  readonly STROKE_FILL_DURATION: number = 3;                          // stroke increase animation duration in seconds    
  readonly STROKE_RESTORE_DURATION: number = 0.3;                     // stroke decrease animation duration in seconds  
  readonly STROKE_FILL_ANIMATION: string = "ease-out";                // stroke increase animation type
  readonly STROKE_RESTORE_ANIMATION: string = "ease-out";          // stroke decrease animation type
  readonly ENABLE_CHARGE_ANIMATION: boolean = false;                  // anable stroke animation
  readonly REDUCE_ICON: boolean = true;                               // reduce icon in the same time
  
  @Input() reverseAnim: boolean = this.REVERSE_ANIM;
  @Input() useShadow: boolean = this.USE_SHADOW;
  @Input() disabled: boolean = this.DISABLED;
  @Input() startAt: number = this.START_AT;
  @Input() endAt: number = this.END_AT;
  @Input() reduceRadius: number = this.REDUCE_RADIUS;
  @Input() radiusAnimationDuration: number = this.RADIUS_ANIMATION_DURATION;
  @Input() radiusAnimation: string = this.RADIUS_ANIMATION;
  @Input() color: any = this.COLOR;
  @Input() iconColor: any = this.ICON_COLOR;
  @Input() strokeColor: any = this.STROKE_COLOR;
  @Input() disabledColor: any = this.DISABLED_COLOR;
  @Input() size: any = this.SIZE;
  @Input() strokeSize: number = this.STROKE_PP_SIZE;
  @Input() strokeRadius: number = this.STROKE_PP_RADIUS;
  @Input() strokeFillDuration: number = this.STROKE_FILL_DURATION;
  @Input() strokeRestoreDuration: number = this.STROKE_RESTORE_DURATION;
  @Input() strokeFillAnimation: string = this.STROKE_FILL_ANIMATION;
  @Input() strokeRestoreAnimation: string = this.STROKE_RESTORE_ANIMATION;
  @Input() enableChargeAnimation: boolean = this.ENABLE_CHARGE_ANIMATION;
  @Input() reduceIcon: boolean = this.REDUCE_ICON;
  @Output() onChargeComplete: EventEmitter<boolean> = new EventEmitter<boolean>();

  private _stroke: any;
  private _button: any;
  private _icon: any;
  private _cover: any;

  private _isButtonRestoring?: boolean = null;
  private _isStrokeRestoring?: boolean = null;
  private _strokeChargeComplete: boolean = false;

  buttonRadius: any = 50;

  constructor(
    private _element: ElementRef,
    private _domCtrl: DomController,
    private _renderer: Renderer2,
    private _platform: Platform
  ) { }


  ngOnInit(): void {
    this._button = this._element.nativeElement.querySelector("#ipc-button circle");
    this._stroke = this._element.nativeElement.querySelector("#ipc-stroke circle");
    this._cover = this._element.nativeElement.querySelector("#ipc-cover circle");
    this._icon = this._element.nativeElement.querySelector("#ipc-icon");
    
    // convert stroke unit to 50 instead of 100
    this.strokeSize = ( this.strokeSize/2);
    this.strokeRadius = (this.strokeRadius/2);

    if (this.useShadow) { 
      this.strokeRadius = this.strokeRadius - 1;
      this.buttonRadius = this.buttonRadius -1;
      this._renderer.addClass(this._button, "circle-shadow");
      this._renderer.addClass(this._stroke, "circle-shadow");
    }
  }

  ngAfterViewInit(): void {
    if (!this._checkInputValues()) { return; }

    this._renderer.listen(this._element.nativeElement, this._platform.is("desktop") ? "mousedown" : "touchstart", this._startAnimation.bind(this));
    this._renderer.listen(this._element.nativeElement, this._platform.is("desktop") ? "mouseup" : "touchend", this._stopAnimation.bind(this));
    this._renderer.listen(this._stroke, "transitionend", this._strokeTransitionEnd.bind(this));
    this._renderer.listen(this._button, "transitionend", this._buttonTransitionEnd.bind(this));

    this._renderer.setStyle(this._stroke, "stroke-dashoffset", (360 - this.startAt));
    this._renderer.setStyle(this._icon, "transition", this.radiusAnimation + " " + this.radiusAnimationDuration + "s");
    this._renderer.setStyle(this._button, "transition", this.radiusAnimation + " " + this.radiusAnimationDuration + "s");
    this._renderer.setStyle(this._cover, "transition", this.radiusAnimation + " " + this.radiusAnimationDuration + "s");
  }

  private _checkInputValues(): boolean{
    this.endAt = this.endAt > 360 ? this.END_AT : this.endAt;
    this.startAt = this.startAt > 360 ? this.START_AT : this.startAt;
    this.strokeRestoreDuration = this.strokeRestoreDuration <= 0 ? this.STROKE_RESTORE_DURATION : this.strokeRestoreDuration;   
    this.enableChargeAnimation = this.enableChargeAnimation && !this.disabled;
    this.enableChargeAnimation = this.enableChargeAnimation && (this.startAt != this.endAt);
    this.enableChargeAnimation = this.enableChargeAnimation && (this.strokeFillDuration > 0);
    this.enableChargeAnimation = this.enableChargeAnimation && (this.reduceRadius < 100);
    this.enableChargeAnimation = this.enableChargeAnimation && (this.radiusAnimationDuration > 0);
    return this.enableChargeAnimation;
  }

  private _restoreButton(){
    this._isButtonRestoring = true;
    this._isStrokeRestoring = null;
    this._domCtrl.write(()=> {
      this._renderer.setStyle(this._button, "r", this.buttonRadius + "%" );
      this._renderer.setStyle(this._cover, "r", this.buttonRadius + "%" );
      if (this.reduceIcon) { this._renderer.setStyle(this._icon, "transform", "scale(1)"); }
    });
  }

  private _reduceButton(){
    this._isButtonRestoring = false;
    this._isStrokeRestoring = null;
    this._domCtrl.write(()=> {
      this._renderer.setStyle(this._button, "r", (50 - (this.reduceRadius/2)) + "%" );
      this._renderer.setStyle(this._cover, "r", (50 - (this.reduceRadius/2)) + "%" );
      if (this.reduceIcon) { this._renderer.setStyle(this._icon, "transform", "scale(" + ( (100 - this.reduceRadius) / 100) + ")"); }
    });
  }

  private _restoreStroke(){
    this._isStrokeRestoring = true;
    this._isButtonRestoring = null;
    this._domCtrl.write(()=> {
      this._renderer.setStyle(this._stroke, "transition", "stroke-dashoffset " + this.strokeRestoreAnimation + " " + this.strokeRestoreDuration + "s");
      this._renderer.setStyle(this._stroke, "stroke-dashoffset", (360 - this.startAt).toString() );
   });
  }

  private _increaseStroke(){
    this._isStrokeRestoring = false;
    this._isButtonRestoring = null;
    this._domCtrl.write(()=> {
      this._renderer.setStyle(this._stroke, "transition", "stroke-dashoffset " + this.strokeFillAnimation + " " + this.strokeFillDuration + "s");
      this._renderer.setStyle(this._stroke, "stroke-dashoffset", (360 - this.endAt).toString() );
    });
  }

  private _startAnimation(){
    this._renderer.addClass(this._cover, "hover-cover");
    if (this._isStrokeRestoring == null) { this._reduceButton(); return; }
    if (this._isStrokeRestoring) { this._increaseStroke(); return; }
  }

  private _stopAnimation(){ 
    this._renderer.removeClass(this._cover, "hover-cover");
    if (this._isButtonRestoring == false) { this._restoreButton(); return; }
    if (this._isButtonRestoring) { return; }
    if ( (this._strokeChargeComplete) && (!this.reverseAnim) ) {
      this._restoreButton();
      return;
    }
    this._strokeChargeComplete = false;
    this._restoreStroke();
  }

  private _strokeTransitionEnd(){
    this._strokeChargeComplete = this._stroke.style.strokeDashoffset == (360 - this.endAt) ? true : false;
    if (this._strokeChargeComplete) { this.onChargeComplete.emit(true); return; }
    this._restoreButton();
  }

  private _buttonTransitionEnd(){
    if ((this._strokeChargeComplete) && (!this.reverseAnim)){
      this._renderer.setStyle(this._stroke, "transition", "none");
      this._renderer.setStyle(this._stroke, "stroke-dashoffset", (360 - this.startAt));
      this._strokeChargeComplete = false;
    }
    if (this._isButtonRestoring) { return; }
    if (this._isButtonRestoring == null) { return; }
    this._increaseStroke();
  }
}
