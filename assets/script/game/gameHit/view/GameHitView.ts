import { Button, EventTouch, Graphics, Node, NodeEventType, PhysicsSystem2D, RigidBody2D, UITransform, Vec3, director, math, physics } from "cc";
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
    private _graphics:Graphics;
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
        this._graphics = this._container.getComponent(Graphics);
        this._player = this._container.getChildByName("Player");
        this._imgArrow = this._player.getChildByName("imgArrow");
        this._imgArrowTf = this._imgArrow.getComponent(UITransform);
        this._rigidbody = this._player.getComponent(RigidBody2D);

        let touchArea = this._container.getChildByName("touchArea");
        touchArea.on(NodeEventType.TOUCH_START,(evt:EventTouch)=>{
            let touchPos = evt.getUIStartLocation(); 
            this.touchStart(touchPos)
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
        CacheManager.game.setGameSpeed(0.1);
        this._graphics.clear();
        this._graphics.fillRect(pos.x - 540,pos.y - 1080,50,50);
        this._graphics.fill();
        this._beginShoot = true;
        this._rigidbody.getLocalCenter(this._startPos);
        this._graphics.fillRect(this._startPos.x,this._startPos.y,10,10);
        this._graphics.fill();
        //pos是以屏幕左下角为原点，所以减去屏幕宽高的一半，为当前container下的实际触摸点
        this._endPos.x = pos.x - 540;
        this._endPos.y = pos.y - 1080;
        
        this._imgArrow.active = true;
        this._graphics.moveTo(this._startPos.x,this._startPos.y);
        this._graphics.lineTo(this._endPos.x,this._endPos.y);
        // this._graphics.close();
        this._graphics.stroke();
        this._graphics.fill();
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
        this._forceVec.multiplyScalar(10 * this._forceScaler);
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