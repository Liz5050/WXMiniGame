import { CacheManager } from "../../../../manager/CacheManager";
import { BaseEntity } from "./BaseEntity";
import { EntityState, EntityType } from "../utils/EntityUtil";
import { _decorator,instantiate,Node, Prefab, SkeletalAnimation, tween, Tween } from "cc";
import { ComponentType } from "../components/ComponentType";

const { ccclass, property } = _decorator;

@ccclass
export class GridHero extends BaseEntity {
    @property(Prefab) model: Prefab = null;
    @property(Node) bodyContainer: Node = null;
    @property(Node) bodyModel: Node = null;

    private _bodyModel: Node;
    private _anim: SkeletalAnimation;
    protected init(): void {
        if (!this._bodyModel) {
            this._bodyModel = instantiate(this.model);
            this.bodyContainer.addChild(this._bodyModel);
        }
        // this._battlePos = new Vec3();
        // this._agentPos = new Vec2();

        this._anim = this._bodyModel.getComponent(SkeletalAnimation);
        this._updateInterval = 0;
        this._anim.play("idle");
    }

    protected initComponent(): void {
        this.addCusComponent(ComponentType.HUD);
        this.addCusComponent(ComponentType.Battle);
    }

    protected playIdle(): void {
        this._anim.crossFade("idle");
    }

    protected playAttackPre() {
        this._anim.crossFade("attack-melee-left");
    }

    protected playDie(): void {
        this.playHurtEffect(true);
    }

    protected playWalk() {
        this._anim.play("walk");
    }

    protected onSelectChanged(): void {
        if(this._isSelected){

        }
    }

    private playHurtEffect(isDead:boolean = false){
        let time
        if(isDead){
            this._anim.play("die");
            time = this._vo.dieTime;
        }
        Tween.stopAllByTarget(this.node);
        if(isDead){
            let hurtTime = 200;
            let deathTime = (time - hurtTime) / 1000;
            tween(this.node).delay(deathTime).call(()=>{
                this.death();
            }).start();
        }
    }
}