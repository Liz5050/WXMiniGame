import { Vec3, math } from "cc";
import MathUtils from "../utils/MathUtils";
import { dispatchMsg } from "../utils/MessageCenter";
import { GEvent } from "../enum/GEvent";
import { GridEntityVo } from "../game/gameGrid3D/scene/vo/GridEntityVo";
import { EntityState, EntityType, EntityUtil } from "../game/gameGrid3D/scene/utils/EntityUtil";
import EntityVo from "../game/gameGrid3D/scene/vo/EntityVo";
import HeroVo from "../game/gameGrid3D/scene/vo/HeroVo";
import EnemyVo from "../game/gameGrid3D/scene/vo/EnemyVo";

export enum GameGrid3DRoundType {
    Ready = 1,
    Battle = 2,
}

export class GameGrid3DCache {
    private _enemyCountList: { [round: number]: number } = {};
    private _resTypeList = [1, 2, 3, 6, 7, 10, 11, 12];
    private _entitys: { [entityId: string]: EntityVo } = {};
    //槽位格子数据
    private _mapGridList: GridEntityVo[] = [];
    private _mapGridListMap: { [key: string]: GridEntityVo } = {};
    //实体数量统计
    private _entityCount: { [type: string]: number } = {};
    private _roundType: GameGrid3DRoundType = GameGrid3DRoundType.Ready;
    private _sceneReady: boolean = false;
    private _round: number = 1;
    private _nextRound: number = 1;

    public initGameData(): void {
        this.clearAll();
        this._round = 1;
        this._nextRound = 1;
        this._roundType = GameGrid3DRoundType.Ready;
        this._enemyCountList = {};
        this._enemyCountList[this._round] = 1;
        this._sceneReady = true;
        this.initMapGridData();
    }

    private initMapGridData(){
        this._mapGridList = [];
        this._mapGridListMap = {};
        for(let row = 0; row < 10; row++){
            for(let col = 0; col < 10; col++){
                const vo = this.addEntity(EntityType.Grid,{pos:new Vec3(col,0,row)});   
                this._mapGridList.push(vo as GridEntityVo);
                this._mapGridListMap[`${col}_${row}`] = vo as GridEntityVo;
            }
        }
    }

    public get mapGridList(): GridEntityVo[] {
        return this._mapGridList;
    }

    public getGridVoByPos(col: number, row: number): GridEntityVo {
        return this._mapGridListMap[`${col}_${row}`];
    }

    public switchRound(): void {
        this._sceneReady = false;
        if (this._roundType === GameGrid3DRoundType.Ready) {
            this._roundType = GameGrid3DRoundType.Battle;
        } else {
            this._roundType = GameGrid3DRoundType.Ready;
        }
        this.setRound(this._nextRound);
        this._sceneReady = true;
        dispatchMsg(GEvent.OnGameGrid3DRoundUpdate, this._roundType);
    }

    private setRound(round: number): void {
        if (this._round === round) return;
        this._round = round;
        this._enemyCountList[this._round] = this._round;
    }

    public get roundType(): GameGrid3DRoundType {
        return this._roundType;
    }

    public get round(): number {
        return this._round;
    }

    public set sceneReady(val: boolean) {
        this._sceneReady = val;
    }

    public isBattle(): boolean {
        return this._roundType === GameGrid3DRoundType.Battle && this._sceneReady;
    }

    public getRandomType(): number {
        const idx = MathUtils.getRandomInt(0, this._resTypeList.length - 1);
        return this._resTypeList[idx];
    }

    public getLeftEnemy(): number {
        let num = 0;
        for (const round in this._enemyCountList) {
            num += this._enemyCountList[round];
        }
        return num;
    }

    private isPlayer(type: EntityType): boolean {
        return type === EntityType.Grid || type === EntityType.Hero || type === EntityType.PlayerKing;
    }

    public delEntity(entityId: string): void {
        const vo = this._entitys[entityId];
        if (!vo) return;

        delete this._entitys[entityId];
        const count = (this._entityCount[vo.type] || 1) - 1;
        this._entityCount[vo.type] = Math.max(count, 0);
        dispatchMsg(GEvent.OnGameGrid3DEntityDelete, entityId);

        if (count <= 0 && this.isBattle()) {
            if (vo.type === EntityType.Enemy && this._nextRound <= this.round) {
                this._nextRound++;
                this.switchRound();
            } else if (this.isPlayer(vo.type)) {
                // Player-side defeat flow is intentionally left for later gameplay work.
            }
        }
    }

    public addEntity(type: EntityType, param?: any): EntityVo {
        let count = this._entityCount[type] || 0;
        const vo = this.genEntityVo(type, param);
        this._entitys[vo.entityId] = vo;
        count++;

        this._entityCount[type] = count;
        return vo;
    }

    public addEntityByNum(type: EntityType, num: number = 1, param?: any): EntityVo[] {
        let count = this._entityCount[type] || 0;
        const list: EntityVo[] = [];
        for (let i = 0; i < num; i++) {
            const vo = this.genEntityVo(type, param);
            this._entitys[vo.entityId] = vo;
            list.push(vo);
            count++;
        }
        this._entityCount[type] = count;
        return list;
    }

    public getSelectedEntity(type: EntityType): EntityVo {
        for (const entityId in this._entitys) {
            const vo = this._entitys[entityId];
            if (vo.type !== type) continue;
            if (vo.entity && vo.entity.isSelected) return vo;
        }
        return null;
    }

    public clearAll(): void {
        this._entitys = {};
        this._entityCount = {};
        this._enemyCountList = {};
        GameGrid3DCache.EntityIds = {};
    }

    public findTarget(pos: Vec3, type: EntityType): EntityVo {
        let minDistance = 9999;
        let target: EntityVo = null;
        for (const entityId in this._entitys) {
            const vo = this._entitys[entityId];
            if(vo.type !== type) continue;
            if (EntityUtil.isGrid(type) !== EntityUtil.isGrid(vo.type)) continue;
            if (!vo.isDead() && vo.state !== EntityState.none) {
                if (vo.type === EntityType.Enemy && vo.isSelected) return vo;
                const dis = math.Vec3.distance(pos, vo.worldPos);
                if (dis < minDistance) {
                    minDistance = dis;
                    target = vo;
                }
            }
        }
        return target;
    }

    public findTargetByList(pos: Vec3, types: EntityType[], filterId?: string): EntityVo {
        let minDistance = 9999;
        let target: EntityVo = null;
        for (const entityId in this._entitys) {
            const vo = this._entitys[entityId];
            if (filterId && filterId === vo.entityId) continue;
            if (types.indexOf(vo.type) === -1) continue;
            if (!vo.isDead() && vo.state !== EntityState.none) {
                if (vo.isSelected) return vo;
                const dis = math.Vec3.distance(pos, vo.worldPos);
                if (dis < minDistance) {
                    minDistance = dis;
                    target = vo;
                }
            }
        }
        return target;
    }

    public checkHeroVoByRow(row: number): EntityVo {
        for (const entityId in this._entitys) {
            const vo = this._entitys[entityId];
            if (vo.type === EntityType.Hero && vo.pos.z === row) return vo;
        }
        return null;
    }

    public checkHeroVoByCol(col: number): EntityVo {
        for (const entityId in this._entitys) {
            const vo = this._entitys[entityId];
            if (vo.type === EntityType.Hero && vo.pos.x === col) return vo;
        }
        return null;
    }

    public static EntityIds: { [type: string]: number } = {};

    /** 生成实体Vo */
    private genEntityVo(type: EntityType, param?: any): EntityVo {
        let id = GameGrid3DCache.EntityIds[type];
        if (!id) id = 1;
        else id++;
        GameGrid3DCache.EntityIds[type] = id;

        let vo: EntityVo;
        let data = {...param, id, type };
        switch (type) {
            case EntityType.Grid:
                vo = GridEntityVo.create(data);
                break;
            case EntityType.Enemy:
                data.maxHp = 5 * this.round + 10;
                vo = EnemyVo.create(data);
                break;
            case EntityType.Hero:
                vo = HeroVo.create(data);
                break;
            default:
                vo = EntityVo.create(data);
                break;
        }
        return vo;
    }
}
