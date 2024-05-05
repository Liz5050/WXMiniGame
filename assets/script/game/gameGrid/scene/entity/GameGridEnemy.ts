import { Node, ParticleSystem, Prefab, Tween, Vec3, _decorator, tween } from "cc";
import { BaseEntity } from "./BaseEntity";
import Mgr from "../../../../manager/Mgr";
import { ComponentType } from "../components/ComponentType";

const { ccclass, property } = _decorator;

@ccclass
export class GameGridEnemy extends BaseEntity {
    @property(Prefab) model: Prefab = null;
    @property(ParticleSystem) hit: ParticleSystem;
    
    protected init(): void {
        this._updateInterval = 0;
    }
    
    protected initComponent(): void {
        this.addCusComponent(ComponentType.HUD);
        this.addCusComponent(ComponentType.Battle);
        this.addCusComponent(ComponentType.RVOMove);
        this.addCusComponent(ComponentType.Actor);
    }

    protected onSelectChanged(): void {
        if(this._isSelected){

        }
    }

    protected playIdle(): void {
        this.resetAgentPos();
    }

    protected playAttackPre() {
        this.resetAgentPos();
    }

    protected playDie(): void {
        this.playHurtEffect(true);
    }

    protected playWalk() {
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
            time = this._vo.dieTime;
            Mgr.soundMgr.play("death/26_death",false);
        }else{
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