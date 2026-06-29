import { CacheManager } from "../../../../manager/CacheManager";
import { EntityState, EntityType, EntityUtil } from "../utils/EntityUtil";
import { EntityComponent } from "./EntityComponent";

export class BattleComponent extends EntityComponent{
    private _searchTypes:EntityType[];
    
    protected updateVo(): void {
        if(EntityUtil.isGrid(this._vo.type)){
            this._searchTypes = [EntityType.Enemy];
        }
        else if(EntityUtil.isEnemy(this._vo.type)){
            this._searchTypes = [EntityType.Grid, EntityType.Hero, EntityType.King];
        }
    }

    protected onUpdate(dt: number): void {
        if (!this._vo || this._vo.isDead() || !this._searchTypes) return;
        if(!CacheManager.gameGrid3D.isBattle()) {
            this._vo.setState(EntityState.idle);
            return;
        }
        if (!this._vo.battleVo || this._vo.battleVo.isDead()) {
            this._vo.battleVo = CacheManager.gameGrid3D.findTargetByList(this._vo.worldPos, this._searchTypes, this._vo.entityId);
        }
        this._vo.setState(this._vo.battleVo ? EntityState.walk : EntityState.idle);
    }
}
