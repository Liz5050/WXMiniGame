import { CacheManager } from "../../../../manager/CacheManager";
import { EntityState, EntityType, EntityUtil } from "../utils/EntityUtil";
import { BaseComponent } from "./BaseComponent";

export class BattleComponent extends BaseComponent{
    private _searchTypes:EntityType[];
    protected onInit(): void {
    }

    protected updateVo(): void {
        if(EntityUtil.isGrid(this._vo.type)){
            this._searchTypes = [EntityType.Enemy];
        }
        else if(EntityUtil.isEnemy(this._vo.type)){
            this._searchTypes = [EntityType.Grid,EntityType.GridHero];
        }
    }

    protected onUpdate(dt: number): void {
        if (!this._vo || this._vo.isDead() || !this._searchTypes) return;
        if(!CacheManager.gameGrid.isBattle()) {
            this._vo.setState(EntityState.idle);
            return;
        }    
        if (this._vo.state == EntityState.idle) {
            if (!this._vo.battleVo || this._vo.battleVo.isDead()) {
                let battleVo = CacheManager.gameGrid.findTargetByList(this._vo.worldPos, this._searchTypes);
                if (!battleVo) return;
                this._vo.battleVo = battleVo;
            }
            if (this._vo.isAttackRange()) {
                this._vo.setState(EntityState.attackPre);
                // this.setState(EntityState.idle);
            }
            else {
                this._vo.setState(EntityState.walk);
            }
        }
        else if (this._vo.state == EntityState.walk) {
            if (!this._vo.battleVo || this._vo.battleVo.isDead()) {
                //移动过程中，目标消失，死亡，或者可攻击时设置idle状态
                this._vo.setState(EntityState.idle);
            }
            else if(this._vo.isAttackRange()){
                this._vo.setState(EntityState.attackPre);
            }
            else{
                //移动过程中不停找最近目标（会根据当前实时距离切换目标）
                let battleVo = CacheManager.gameGrid.findTargetByList(this._vo.worldPos, this._searchTypes,this._vo.battleVo.entityId);
                if (!battleVo) return;
                this._vo.battleVo = battleVo;
            }
        }
    }
}