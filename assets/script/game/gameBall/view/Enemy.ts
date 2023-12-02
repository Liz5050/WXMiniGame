import { Contact2DType } from 'cc';
import { PhysicsGroup } from 'cc';
import { Collider2D } from 'cc';
import { _decorator, Component } from 'cc';
import { Animation } from 'cc';
import { EventManager } from '../../../manager/EventManager';
import { EventEnum } from '../../../enum/EventEnum';
import TweenManager from '../../../common/TweenManager';
import { ProgressBar } from 'cc';
import { CacheManager } from '../../../manager/CacheManager';
const { ccclass, property } = _decorator;

@ccclass('Enemy')
export class Enemy extends Component {
    private _bodyAnim:Animation;
    private _hpBar:ProgressBar;
    private _enemyInfo:any;

    private _enemySize:number = 145;
    onLoad(){
        let physicsNode = this.node.getChildByName("physics");
        let collider = physicsNode.getComponent(Collider2D);
        collider.on(Contact2DType.BEGIN_CONTACT,this.beginContact,this);
        let body = this.node.getChildByName("body");
        this._hpBar = body.getChildByName("hpBar").getComponent(ProgressBar);
        this._bodyAnim = body.getComponent(Animation);
    }

    start() {
        
    }

    update(deltaTime: number) {
        
    }
    
    public setData(enemyInfo){
        this.node.active = true;

        this._enemyInfo = enemyInfo;
        let halfSize = this._enemySize/2;
        let pixelX = -440 + halfSize + enemyInfo.x * this._enemySize + enemyInfo.x * 1;
        let pixelY = -(this._enemyInfo.y * this._enemySize + this._enemyInfo.y * 1);
        this.node.setPosition(pixelX,pixelY);
        this._bodyAnim.play("EnemyBorn");
    }

    private beginContact(selfCollider: Collider2D, otherCollider: Collider2D){
        if(PhysicsGroup[otherCollider.group] == "ball"){
            this.hurt(20);
        }
        else if(PhysicsGroup[otherCollider.group] == "wall" && otherCollider.tag == 4){
            this.reset();
        }
    }

    public hurt(damage:number){
        this._enemyInfo.hp -= damage;
        if(this._enemyInfo.hp <= 0){
            this.death();
        }
        else{
            this.updateHp();
            this._bodyAnim.play("EnemyHurt");
        }
    }

    public updateHp(){
        let curHp = this._enemyInfo.hp;
        let maxHp = this._enemyInfo.maxHp;
        let hpProgress = curHp / maxHp;
        this._hpBar.progress = hpProgress;
    }

    public executeRound(){
        if(!this._enemyInfo){
            return;
        }
        this._bodyAnim.play("EnemyMove");
        let posY = this._enemyInfo.y + 1;
        let pixelY = -(posY * this._enemySize + posY * 1);
        TweenManager.addTween(this.node).to({y:pixelY},620).call(()=>{
            this._enemyInfo.executeRound = false;
            EventManager.dispatch(EventEnum.OnEnemyRoundComplete);
        });
        this._enemyInfo.y = posY;
    }

    public death(){
        this.reset();
        CacheManager.gameBall.killUpdate(1);
    }

    private reset(){
        this.onlyClear();
        EventManager.dispatch(EventEnum.OnEnemyReset,this._enemyInfo.id);
    }

    public onlyClear(){
        this._hpBar.progress = 1;
        TweenManager.removeTweens(this.node);
        this.node.active = false;
    }
}