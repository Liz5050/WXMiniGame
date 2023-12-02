import { _decorator, Component, math, RigidBody2D, PhysicsGroup, IPhysics2DContact, Node, Collider2D, Contact2DType} from 'cc';
import Mgr from '../../../manager/Mgr';
import MathUtils from '../../../utils/MathUtils';
import { EventManager } from '../../../manager/EventManager';
import { EventEnum } from '../../../enum/EventEnum';
import { Sprite } from 'cc';
import { MotionStreak } from 'cc';
import TweenManager from '../../../common/TweenManager';
const { ccclass, property } = _decorator;

@ccclass('BallItem')
export class BallItem extends Component {
    private _collider:Collider2D;
    private _rigidbody:RigidBody2D;
    private _bgCirc:Node;
    private _bodyImg:Sprite;
    private _motionStreak:MotionStreak;

    private _curDir:math.Vec2;
    private _forceVec:math.Vec2;
    private _curPos:math.Vec3;
    private _isReset:boolean = false;
    private _shootInterval:number = 80;//发射间隔300ms
    protected onLoad(): void {
        this._bgCirc = this.node.getChildByName("bgCirc");
        this._bodyImg = this._bgCirc.getChildByName("body").getComponent(Sprite);
        this._motionStreak = this._bgCirc.getChildByName("motionStreak").getComponent(MotionStreak);
        
        this._rigidbody = this.node.getComponent(RigidBody2D);    

        this._collider = this.node.getComponent(Collider2D);
        this._collider.on(Contact2DType.BEGIN_CONTACT,this.beginContact,this);
        this._curDir = new math.Vec2();
        this._forceVec = new math.Vec2();
        this._curPos = new math.Vec3();
    }

    start() {
    }

    update(deltaTime: number) {
        if(this._isReset){
            return;
        }
        if(!this._collider.enabled){
            this._curPos = this.node.getPosition(this._curPos);
            if(this._curPos.y <= -200){
                this.reset();
                EventManager.dispatch(EventEnum.OnGameBallReset,this.node);
            }
        }
    }

    public setData(data){

    }

    public show(showIndex:number,startPos:math.Vec3,force:math.Vec3){
        this.node.setPosition(startPos);
        this._isReset = false;
        this._collider.enabled = true;

        let waitTime = this._shootInterval * showIndex;
        TweenManager.addTween(this.node).wait(waitTime).call(()=>{
            this.startShoot(force);
        });
        return waitTime;
    }

    // 设置旋转角度
    private updateAngle() {
        let rad = Math.atan2(this._curDir.y,this._curDir.x);
        let angle = MathUtils.getAngle(rad) - 90;
        this._bgCirc.setRotationFromEuler(0,0,angle);
    }

    private _rigidbodyVel1:math.Vec2 = new math.Vec2();
    private _rigidbodyVel2:math.Vec2 = new math.Vec2();
    private beginContact(selfCollider: Collider2D, otherCollider: Collider2D,contact:IPhysics2DContact){
        if(selfCollider.node !== this.node){
            return;
        }
        
        if(PhysicsGroup[otherCollider.group] == "wall" && otherCollider.tag == 4){
            this.reset();
            EventManager.dispatch(EventEnum.OnGameBallReset,this.node);
            return;
        }
        const worldManifold = contact.getWorldManifold();
        this._rigidbody.getLinearVelocityFromWorldPoint(worldManifold.points[0],this._rigidbodyVel1);
        otherCollider.node.getComponent(RigidBody2D).getLinearVelocityFromWorldPoint(worldManifold.points[0],this._rigidbodyVel2);
        let relativeVelocity = this._rigidbodyVel1.subtract(this._rigidbodyVel2);
        
        this._curDir.x = relativeVelocity.x;
        this._curDir.y = relativeVelocity.y;
        this._curDir.normalize();
        this.updateAngle();

        if(PhysicsGroup[otherCollider.group] == "enemy"){
            //是怪物，播放受击音效
            Mgr.soundMgr.play("ball_shoot2");
        }
        else{
        }
    }

    public startShoot(force:math.Vec3){
        this._collider.enabled = true;
        this.node.active = true;
        Mgr.soundMgr.play("ball_shoot",false);
        // this._rigidbody.applyLinearImpulseToCenter(this._forceVec,true);
        this._forceVec.x = force.x;
        this._forceVec.y = force.y;
        this._forceVec.normalize();
        this._forceVec.multiplyScalar(3000);
        this._rigidbody.applyForceToCenter(this._forceVec,true);

        this._curDir.x = force.x;
        this._curDir.y = force.y;
        this._curDir.normalize();
        this.updateAngle();
    }

    public gotoPoint(x:number,y:number){
        this._rigidbody.sleep();
        this._collider.enabled = false;
        this._curPos = this.node.getPosition(this._curPos);
        this._forceVec.x = this._curPos.x;
        this._forceVec.y = this._curPos.y;

        this._curDir.x = x;
        this._curDir.y = y;
        this._curDir.subtract(this._forceVec);
        this._curDir.normalize();
        this._curDir.multiplyScalar(8000);
        this._rigidbody.applyForceToCenter(this._curDir,true);
        this.updateAngle();
    }

    private reset(){
        this._rigidbody.sleep();
        this.node.setPosition(0,0);
        this.node.active = false;
        this._isReset = true;
    }
}


