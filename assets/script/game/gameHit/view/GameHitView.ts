import { Button, EventTouch, Node, NodeEventType, RigidBody2D, UITransform, math } from "cc";
import { UIModuleEnum } from "../../../enum/UIDefine";
import { BaseUIView } from "../../base/BaseUIView";
import { EventManager } from "../../../manager/EventManager";
import { EventEnum } from "../../../enum/EventEnum";
import { GameType } from "../../../enum/GameType";
import MathUtils from "../../../utils/MathUtils";
import Mgr from "../../../manager/Mgr";
import { CacheManager } from "../../../manager/CacheManager";

export class GameHitView extends BaseUIView{
    private _beginShoot:boolean = false;
    private _shooting:boolean = false;
    private _container:Node;
    private _player:Node;
    private _imgArrow:Node;
    private _imgArrowTf:UITransform;
    private _rigidbody:RigidBody2D;

    private _startPos:math.Vec3;
    private _endPos:math.Vec3;
    private _evtTouchPos:math.Vec3;

    private _forceVec:math.Vec2;
    private _forceScaler:number = 10;
    public constructor(){
        super(UIModuleEnum.gameHit,"GameHitView");
    }

    protected initUI(): void {
        this._forceVec = new math.Vec2();
        this._startPos = new math.Vec3();
        this._endPos = new math.Vec3();
        this._evtTouchPos = new math.Vec3();

        this._container = this.getChildByName("container");
        this._player = this._container.getChildByName("Player");
        this._imgArrow = this._player.getChildByName("imgArrow");
        this._imgArrowTf = this._imgArrow.getComponent(UITransform);
        this._rigidbody = this._player.getComponent(RigidBody2D);

        let touchArea = this._container.getChildByName("touchArea");
        touchArea.on(NodeEventType.TOUCH_START,(evt:EventTouch)=>{
            let touchPos = evt.getUIStartLocation(); 
            this.touchStart(touchPos);
        })
    
        touchArea.on(NodeEventType.TOUCH_CANCEL,()=>{
            this.touchEnd();
        });
    
        touchArea.on(NodeEventType.TOUCH_END,()=>{
            this.touchEnd();
        });
    
        touchArea.on(NodeEventType.TOUCH_MOVE,(event:EventTouch)=>{
            let pos = event.getUIDelta();
            this.touchMove(pos.x,pos.y);
        });

        let btnExit = this.getChildByName("btnExit");
        btnExit.on(Button.EventType.CLICK,()=>{
            this.hide();
        });

        
    }

    private touchStart(pos){
        if(this._beginShoot || this._shooting) return;
        CacheManager.game.setGameSpeed(0.3);
        this._beginShoot = true;
        this._player.getPosition(this._startPos);
        this._evtTouchPos.x = pos.x + this._startPos.x;
        this._evtTouchPos.y = pos.y + this._startPos.y;
        
        this._imgArrow.active = true;
        this._container.inverseTransformPoint(this._endPos,this._evtTouchPos);
        this.updateDis();

        // this._imgArrow.setPosition(this._startPos.x,this._startPos.y);
    }

    private touchMove(deltaX:number,deltaY:number){
        if(this._beginShoot){
            let endX = this._endPos.x + deltaX;
            let endY = this._endPos.y + deltaY;
            this._endPos.x = endX;
            this._endPos.y = endY; 
            this.updateDis();
        }
    }

    private touchEnd(){
        if(!this._beginShoot) return;
        CacheManager.game.setGameSpeed(1);
        this._beginShoot = false;
        this._imgArrow.active = false;
        if(this._endPos.x == this._startPos.x && this._endPos.y == this._startPos.y){
            this._endPos.x = 0;
            this._endPos.y = 1;
        }
        else {
            this._endPos.subtract(this._startPos);
        }
        this.shoot();
    }

    private updateDis(){
        let dis = MathUtils.getDistance(this._startPos.x,this._startPos.y,this._endPos.x,this._endPos.y);
        this._imgArrowTf.setContentSize(40,dis);
        this._forceScaler = dis;

        let angle = MathUtils.getAngle2(this._startPos.x,this._startPos.y,this._endPos.x,this._endPos.y) - 90;
        this._imgArrow.setRotationFromEuler(0,0,angle);
    }

    private shoot(){
        if(this._shooting) return;
        // this._shooting = true;
        this._beginShoot = false;
        Mgr.soundMgr.play("ball_shoot",false);
        // this._rigidbody.applyLinearImpulseToCenter(this._forceVec,true);
        this._forceVec.x = this._endPos.x;
        this._forceVec.y = this._endPos.y;
        this._forceVec.normalize();
        this._forceVec.multiplyScalar(100 * this._forceScaler);
        this._rigidbody.applyLinearImpulseToCenter(this._forceVec,true);
        console.log("force:" + this._forceScaler)

        // this._curDir.x = force.x;
        // this._curDir.y = force.y;
        // this._curDir.normalize();
        // // this.updateAngle();
    }
    public hide(): void {
        super.hide();
        EventManager.dispatch(EventEnum.OnGameExit,GameType.GameHit);
    }
}