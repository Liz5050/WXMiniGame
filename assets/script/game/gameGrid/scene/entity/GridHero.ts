import { CacheManager } from "../../../../manager/CacheManager";
import { BaseEntity } from "./BaseEntity";
import { EntityState, EntityType } from "../utils/EntityUtil";
import { _decorator,instantiate,Node, Prefab, SkeletalAnimation, tween, Tween } from "cc";
import { ComponentType } from "../components/ComponentType";

const { ccclass, property } = _decorator;

@ccclass
export class GridHero extends BaseEntity {
    
    protected init(): void {
    }

    protected initComponent(): void {
        this.addCusComponent(ComponentType.HUD);
        this.addCusComponent(ComponentType.Battle);
        this.addCusComponent(ComponentType.RVOMove);
        this.addCusComponent(ComponentType.Actor);
    }

    protected playIdle(): void {
    }

    protected playAttackPre() {
    }

    protected playDie(): void {
        tween(this.node).delay(this.vo.dieTime).call(()=>{
            this.death();
        }).start();
    }

    protected playWalk() {
    }

    protected onSelectChanged(): void {
        if(this._isSelected){

        }
    }
}