import { Vec3, game, math } from "cc";
import Mgr from "../../../../manager/Mgr";
import { BaseEntity } from "../entity/BaseEntity";
import { CacheManager } from "../../../../manager/CacheManager";
import { EventManager } from "../../../../manager/EventManager";
import { EventEnum } from "../../../../enum/EventEnum";
import { EntityState, EntityType } from "../utils/EntityUtil";
import BaseVo from "../../../base/BaseVo";
import EntityStateUtil from "../utils/EntityStateUtil";
import { dispatchMsg } from "db://assets/script/utils/MessageCenter";
import { GEvent } from "db://assets/script/enum/GEvent";
import { IEntityVo } from "../../interface/GameInterface";
import { StateMachine } from "../statemachine/StateMachine";

interface EntityVo extends TypeAlias<IEntityVo> {}
class EntityVo extends BaseVo {
    private _entity: BaseEntity;
    private _stateMachine: StateMachine;
    protected onInit() {
        this._stateMachine = new StateMachine(this);
        this._stateMachine.start();
    }
    
    public setEntity(entity: BaseEntity) {
        this._entity = entity;
    }

    public get entity():BaseEntity{
        return this._entity;
    }

    public get isSelected(){
        return this._entity && this._entity.isSelected;
    }

    // public set exp(val:number){
    //     this._exp = val;
    // }

    // public addExp(val:number){
    //     let exp = this._exp + val;
    //     if(exp >= this.maxExp){
    //         this._exp = this.maxExp - exp;
    //         this.levelUp();
    //         console.log("addexp:"+this._exp + "---maxExp" + this.maxExp)
    //     }
    //     else{
    //         this._exp = exp;
    //     }
    // }

    // private levelUp(){
    //     this.level ++;
    //     this._attack += 10;
    //     this._maxHp = 100 + this.level * 10;
    //     this.maxExp = Math.min(this.level * 10,80);
    //     this.hp = this._maxHp;
    // }

    // private canAttack(): boolean {
    //     if (!this.battleVo || this.battleVo.isDead()) return false;
    //     let time = game.totalTime - this._attackTime;
    //     if (time >= this._attackCD) {
    //         return this.isAttackRange();
    //     }
    //     return false;
    // }

    // public isAttackRange(): boolean {
    //     let dis = math.Vec3.distance(this._battleVo.pos, this.pos);
    //     return dis <= this._attackDistance;
    // }
    // public getNextSkillId():number{
    //     let skillList = this._skills;
    //     if(!skillList || skillList.length == 0) return 1;
    //     return skillList[0];
    // }

    // public clear(){
    //     this._isDel = true;
    //     dispatchMsg(GEvent.OnEntityDelete,this.entityId);
    //     CacheManager.gameGrid.delEntity(this.entityId);
    // }
   
    // public set hp(val: number) {
    //     if(this._hp <= 0 && val <= 0) return;
    //     this._hp = val;
    //     // if(isHurt) {
    //     //     if(val <= 0) this.setState(EntityState.die);
    //     //     else this.setState(EntityState.stiffness);
    //     // }
    //     // else{
    //     //     this.entity && this.entity.updateHp();
    //     // }
    // }
    public get entityId():string {
        return this.type + "_" + this.id;
    }
}
export default EntityVo;