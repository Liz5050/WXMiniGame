import { AnimationState, BoxCollider, Node, Prefab, SkeletalAnimation, Vec3, _decorator, instantiate, math } from "cc";
import { EntityState, EntityType, EntityVo } from "../../vo/EntityVo";
import { CacheManager } from "../../../../manager/CacheManager";
import { BaseEntity } from "./BaseEntity";

const {ccclass , property} = _decorator;

@ccclass
export class GameGridEnemy extends BaseEntity {
    @property(Prefab) model:Prefab = null;
    @property(Node) bodyContainer:Node = null;
    @property(BoxCollider) collider:BoxCollider = null;
    private _bodyModel:Node;
    private _anim:SkeletalAnimation;
    private _animStateIdle:AnimationState;
    
    private _canMove:boolean = false;
    private _updatePos:Vec3;
    protected init(): void {
        if(!this._bodyModel){
            this._bodyModel = instantiate(this.model);
            this._bodyModel.setScale(2,2,2);
            this.bodyContainer.addChild(this._bodyModel);
        }
        this._anim = this._bodyModel.getComponent(SkeletalAnimation);
        this._animStateIdle = this._anim.getState("idle");
        this._anim.play("idle");
        this._updateInterval = 0;
        this._updatePos = new Vec3();
    }

    protected updateSub(dt: number): void {
        if(!this._vo) return;
        if(!this._vo.battleVo) {
            let battleVo = CacheManager.gameGrid.findTarget(this._vo.pos,EntityType.Grid);
            if(battleVo){
                // if(!this._dir){
                //     this._dir = new Vec3();
                // }
                // math.Vec3.subtract(this._dir,battleVo.pos,this._vo.pos);
                // this._dir.normalize();
                // this._dir.y = 0;
                // this._dir.multiplyScalar(this._vo.speed);
                // console.log("find target dir:" + this._dir.x + "_" + this._dir.y + "_" + this._dir.z);
                this._vo.battleVo = battleVo;
            }
            else {
                if(this._vo.state == EntityState.idle){
                    if(this._playState != EntityState.idle){
                        this._playState = EntityState.idle;
                        this.playIdle();
                    }
                }
                else{
                    this.setState(EntityState.idle);
                }
                return;
            }
        }
        if(this._vo.battleVo.isDead()) {
            this.setState(EntityState.idle);
            return;
        }
        if(this._vo.state == EntityState.idle){
            if(this.setState(EntityState.attackPre)){
            }
            else if(!this._vo.isAttackRange()){
                console.log("不在攻击范围内x:" + this._vo.battleVo.pos.x + "z:" + this._vo.battleVo.pos.z + "----isDead:" + this._vo.battleVo.isDead());
                this.setState(EntityState.walk);
            }
            else if(!this._animStateIdle.isPlaying){
                this.playIdle();
            }
        } else if (this._vo.state == EntityState.walk) {
            this.moving();
        }
    }

    protected onStateChanged(state:EntityState): void {
        this._canMove = state == EntityState.walk;
    }

    protected playIdle(): void {
        this._anim.crossFade("idle");
    }

    protected playAttackPre(){
        this._anim.crossFade("attack-melee-left");
    }

    protected playWalk(){
        this._anim.play("walk");
    }

    protected moving(): void {
        if(!this._canMove) return;
        this._updatePos.x = this.node.position.x;
        this._updatePos.z = this.node.position.z; 
        this._updatePos.lerp(this._vo.battleVo.pos,0.02);
        // this.node.translate(this._dir);
        this.node.setPosition(this._updatePos);
        this._vo.updatePos(this._updatePos);
        if(this._vo.canAttack()) {
            this.stopMove();
        }
    }

    protected stopMove(): void {
        this.setState(EntityState.idle);    
    }

    protected stiffness(){
        this._anim.crossFade("idle");
    }

    protected onEntityVoUpdate(){
        this.node.setPosition(this._vo.pos);
    }
}