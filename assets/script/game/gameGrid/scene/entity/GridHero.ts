import { CacheManager } from "../../../../manager/CacheManager";
import { BaseEntity } from "./BaseEntity";
import { EntityState, EntityType } from "../utils/EntityUtil";

export class GridHero extends BaseEntity {
    protected init(): void {
        
    }

    protected updateSub(dt: number): void {
        if(!this._vo || this._vo.isDead()) return;
        if(this._vo.type != EntityType.GridHero) return;
        if(!CacheManager.gameGrid.isBattle()) {
            this.setState(EntityState.idle);
            return;
        }
        if (this._vo.state == EntityState.idle) {
            if (!this._vo.battleVo || this._vo.battleVo.isDead()) {
                let battleVo = CacheManager.gameGrid.findTarget(this._vo.worldPos, EntityType.Enemy);
                if (!battleVo) return;
                this._vo.battleVo = battleVo;
            }
            if (this._vo.isAttackRange()) {
                this.setState(EntityState.attackPre);
                // this.setState(EntityState.idle);
            }
        }
    }

    protected onSelectChanged(): void {
        if(this._isSelected){

        }
    }
}