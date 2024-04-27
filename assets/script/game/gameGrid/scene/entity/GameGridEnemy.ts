import { AnimationState, BoxCollider, Node, ParticleSystem, Prefab, SkeletalAnimation, Tween, Vec2, Vec3, _decorator, instantiate, math, tween } from "cc";
import { EntityVo } from "../vo/EntityVo";
import { CacheManager } from "../../../../manager/CacheManager";
import { BaseEntity } from "./BaseEntity";
import Simulator from "../../../../RVO/Simulator";
import RVOMath from "../../../../RVO/RVOMath";
import Mgr from "../../../../manager/Mgr";
import { EntityPool } from "./EntityPool";
import { EntityState, EntityType } from "../utils/EntityUtil";
import { ComponentType } from "../components/ComponentType";

const { ccclass, property } = _decorator;

@ccclass
export class GameGridEnemy extends BaseEntity {
    @property(Prefab) model: Prefab = null;
    @property(Node) bodyContainer: Node = null;
    @property(ParticleSystem) hit: ParticleSystem;
    private _bodyModel: Node;
    private _anim: SkeletalAnimation;
    private _animStateIdle: AnimationState;
    protected init(): void {
        if (!this._bodyModel) {
            this._bodyModel = instantiate(this.model);
            this._bodyModel.setScale(2.8, 2.8, 2.8);
            this.bodyContainer.addChild(this._bodyModel);
        }
        // this._battlePos = new Vec3();
        // this._agentPos = new Vec2();

        this._anim = this._bodyModel.getComponent(SkeletalAnimation);
        this._animStateIdle = this._anim.getState("idle");
        this._updateInterval = 0;
        this._anim.play("idle");
    }
    
    protected initComponent(): void {
        this.addCusComponent(ComponentType.HUD);
        this.addCusComponent(ComponentType.Battle);
        this.addCusComponent(ComponentType.RVOMove);
    }

    protected onSelectChanged(): void {
        if(this._isSelected){

        }
    }

    protected playIdle(): void {
        this._anim.crossFade("idle");
        this.resetAgentPos();
    }

    protected playAttackPre() {
        this._anim.crossFade("attack-melee-left");
        this.resetAgentPos();
    }

    protected playDie(): void {
        this.playHurtEffect(true);
    }

    protected playWalk() {
        this._anim.play("walk");
    }

    protected playStiffness(): void {
        this.resetAgentPos();
        this.playHurtEffect();
    }

    protected playHurt(isDead?: boolean): void {
        this.playHurtEffect();
    }

    private playHurtEffect(isDead:boolean = false){
        let time
        if(isDead){
            this._anim.play("die");
            time = this._vo.dieTime;
            Mgr.soundMgr.play("death/26_death",false);
        }else{
            this._anim.crossFade("sit");
            time = this._vo.stiffnessTime;
        }
        this.hit.play();
        Mgr.soundMgr.play("damage03",false);
        let curPos = this.node.position;
        Tween.stopAllByTarget(this.node);
        if(isDead){
            let hurtTime = 200;
            let deathTime = (time - hurtTime) / 1000;
            tween(this.node).to(hurtTime / 1000,{position:new Vec3(curPos.x,0,curPos.z - 1)}).delay(deathTime).call(()=>{
                this.death();
            }).start();
        }
        else {
            if(this._vo.stiffnessTime > 0){
                let hurtTime = this._vo.stiffnessTime / 1000;
                tween(this.node).to(hurtTime,{position:new Vec3(curPos.x,0,curPos.z - 1)}).call(()=>{
                    this._vo.updatePos(this.node.position,this.node.worldPosition);
                    this.updateRVO();
                }).start();
            }
        }
    }

    private updateRVO(){
        let com = this._components[ComponentType.RVOMove];
        // @ts-ignore
        com && com.updatePos();
    }

    private resetAgentPos(){
        let com = this._components[ComponentType.RVOMove];
        // @ts-ignore
        com && com.updateAgent();
    }

    public resetEntity(): void {
        this.hit.stop();
        super.resetEntity();
    }
}