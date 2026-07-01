import { Vec3, math } from "cc";
import MathUtils from "../utils/MathUtils";
import { dispatchMsg } from "../utils/MessageCenter";
import { GEvent } from "../enum/GEvent";
import { GridEntityVo, GridOwner, GridSummonConfig } from "../game/gameGrid3D/scene/vo/GridEntityVo";
import { EntityState, EntityType, EntityUtil } from "../game/gameGrid3D/scene/utils/EntityUtil";
import EntityVo from "../game/gameGrid3D/scene/vo/EntityVo";
import HeroVo from "../game/gameGrid3D/scene/vo/HeroVo";
import EnemyVo from "../game/gameGrid3D/scene/vo/EnemyVo";
import KingVo from "../game/gameGrid3D/scene/vo/KingVo";

export enum GameGrid3DRoundType {
    Ready = 1,
    Battle = 2,
}

export class GameGrid3DCache {
    private static readonly TileUpgradeProgress: number = 10;
    private static readonly GridSize: number = 10;
    private static readonly CoreGridMin: number = 4;
    private static readonly CoreGridMax: number = 5;

    private _enemyCountList: { [round: number]: number } = {};
    private _resTypeList: number[] = [1, 2, 3, 6, 7, 10, 11, 12];
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
    private _kingVo: KingVo = null;

    public initGameData(): void {
        this.clearAll();
        this._round = 1;
        this._nextRound = 1;
        this._roundType = GameGrid3DRoundType.Ready;
        this._enemyCountList = {};
        this._enemyCountList[this._round] = 1;
        this._sceneReady = true;
        this.initMapGridData();
        this.initKingData();
    }

    private initMapGridData(): void {
        this._mapGridList = [];
        this._mapGridListMap = {};
        for(let row = 0; row < GameGrid3DCache.GridSize; row++){
            for(let col = 0; col < GameGrid3DCache.GridSize; col++){
                const vo = this.addEntity(EntityType.Grid,{pos:new Vec3(col,0,row), isCoreGrid: this.isCoreGrid(col, row)});   
                this._mapGridList.push(vo as GridEntityVo);
                this._mapGridListMap[`${col}_${row}`] = vo as GridEntityVo;
            }
        }
    }

    private initKingData(): void {
        this._kingVo = this.addEntity(EntityType.King, { pos: new Vec3(4.5, 0, 4.5) }) as KingVo;
        this.updateKingLevel();
    }

    public get mapGridList(): GridEntityVo[] {
        return this._mapGridList;
    }

    public getAllGridVos(): GridEntityVo[] {
        return this._mapGridList;
    }

    public getGridVoByPos(col: number, row: number): GridEntityVo {
        return this._mapGridListMap[`${col}_${row}`];
    }

    public switchRound(): void {
        if (this._roundType === GameGrid3DRoundType.Ready) {
            this.switchToBattle();
        } else {
            this.switchToBuild();
        }
    }

    /** 显式切换到构建阶段 */
    public switchToBuild(force: boolean = false): void {
        const fromBattle = this._roundType === GameGrid3DRoundType.Battle;
        if (!force && this._roundType === GameGrid3DRoundType.Ready) return;

        this._sceneReady = false;
        this._roundType = GameGrid3DRoundType.Ready;
        if (fromBattle) {
            this.setRound(this._round + 1);
        } else {
            this.setRound(this._nextRound);
        }
        this._nextRound = this._round;
        this._sceneReady = true;
        dispatchMsg(GEvent.OnGameGrid3DRoundUpdate, this._roundType);
    }

    /** 显式切换到战斗阶段 */
    public switchToBattle(force: boolean = false): void {
        if (!force && this._roundType === GameGrid3DRoundType.Battle) return;

        this._sceneReady = false;
        this._roundType = GameGrid3DRoundType.Battle;
        this.setRound(this._round);
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
        return type === EntityType.Grid || type === EntityType.Hero || type === EntityType.King;
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

    /** 查询指定类型存活实体 */
    public getAliveEntities(type: EntityType): EntityVo[] {
        const list: EntityVo[] = [];
        for (const entityId in this._entitys) {
            const vo = this._entitys[entityId];
            if (vo.type !== type) continue;
            if (vo.isDead()) continue;
            list.push(vo);
        }
        return list;
    }

    /** 查询所有已配置战斗格 */
    public getBattleGridVos(): GridEntityVo[] {
        const list: GridEntityVo[] = [];
        for (const grid of this._mapGridList) {
            if (grid.isBattleGrid) list.push(grid);
        }
        return list;
    }

    /** 获取核心据点 Vo */
    public getKingVo(): KingVo {
        return this._kingVo;
    }

    /** 设置地块召唤配置 */
    public setGridSummonConfig(grid: GridEntityVo, config: GridSummonConfig): void {
        if (!grid || grid.isCoreGrid || !config) return;
        grid.update({
            isBattleGrid: true,
            summonUnitType: config.summonUnitType,
            summonBranchId: config.summonBranchId,
            summonUnitStage: this.getSummonStageByTileLevel(grid.tileLevel),
            owner: GridOwner.Player,
        });
        dispatchMsg(GEvent.OnGameGrid3DGridDataUpdate, grid);
    }

    /** 推进消除命中的行列地块成长 */
    public addTileProgressByLines(cols: number[], rows: number[]): void {
        for (const col of cols) {
            for (let row = 0; row < GameGrid3DCache.GridSize; row++) {
                const vo = this.getGridVoByPos(col, row);
                if (vo) this.addTileProgress(vo, 1);
            }
        }
        for (const row of rows) {
            for (let col = 0; col < GameGrid3DCache.GridSize; col++) {
                const vo = this.getGridVoByPos(col, row);
                if (vo) this.addTileProgress(vo, 1);
            }
        }
        this.updateKingLevel();
    }

    /** 重置本轮战斗格基础召唤标记 */
    public resetBattleGridSummonState(): void {
        for (const grid of this._mapGridList) {
            if (!grid.hasSummonedThisBattle) continue;
            grid.update({ hasSummonedThisBattle: false });
            dispatchMsg(GEvent.OnGameGrid3DGridDataUpdate, grid);
        }
    }

    /** 标记战斗格已完成本轮基础召唤 */
    public markBattleGridSummoned(grid: GridEntityVo): void {
        if (!grid || grid.hasSummonedThisBattle) return;
        grid.update({ hasSummonedThisBattle: true });
        dispatchMsg(GEvent.OnGameGrid3DGridDataUpdate, grid);
    }

    /** 清理本轮战斗临时实体 */
    public clearBattleEntities(): void {
        const clearIds: string[] = [];
        for (const entityId in this._entitys) {
            const vo = this._entitys[entityId];
            if (vo.type === EntityType.Hero || vo.type === EntityType.Enemy) {
                clearIds.push(entityId);
            }
        }
        for (const entityId of clearIds) {
            this.delEntity(entityId);
        }
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

    /** 根据格子坐标查找占有多格的实体（如核心据点） */
    public findEntityByOccupyGrid(col: number, row: number): EntityVo {
        for (const entityId in this._entitys) {
            const vo = this._entitys[entityId];
            if (vo.type === EntityType.Grid) continue;
            if (vo.occupyCol <= 1 && vo.occupyRow <= 1) continue;
            if (!vo.entity) continue;
            if (vo.containsGrid(col, row)) return vo;
        }
        return null;
    }

    public clearAll(): void {
        this._entitys = {};
        this._entityCount = {};
        this._enemyCountList = {};
        this._kingVo = null;
        this._mapGridList = [];
        this._mapGridListMap = {};
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
            case EntityType.King:
                vo = KingVo.create(data);
                break;
            default:
                vo = EntityVo.create(data);
                break;
        }
        return vo;
    }

    private addTileProgress(grid: GridEntityVo, addProgress: number): void {
        if (!grid) return;
        let nextProgress = grid.tileProgress + addProgress;
        let nextLevel = grid.tileLevel;
        while (nextProgress >= GameGrid3DCache.TileUpgradeProgress) {
            nextProgress -= GameGrid3DCache.TileUpgradeProgress;
            nextLevel++;
        }
        grid.update({
            tileLevel: nextLevel,
            tileProgress: nextProgress,
            summonUnitStage: this.getSummonStageByTileLevel(nextLevel),
        });
        dispatchMsg(GEvent.OnGameGrid3DGridDataUpdate, grid);
    }

    private getSummonStageByTileLevel(tileLevel: number): number {
        return Math.max(1, tileLevel);
    }

    private updateKingLevel(): void {
        if (!this._kingVo) return;
        let level = Number.MAX_SAFE_INTEGER;
        for (const grid of this._mapGridList) {
            if (!grid.isCoreGrid) continue;
            level = Math.min(level, grid.tileLevel);
        }
        if (level === Number.MAX_SAFE_INTEGER) level = 1;
        this._kingVo.update({ level });
    }

    private isCoreGrid(col: number, row: number): boolean {
        return col >= GameGrid3DCache.CoreGridMin
            && col <= GameGrid3DCache.CoreGridMax
            && row >= GameGrid3DCache.CoreGridMin
            && row <= GameGrid3DCache.CoreGridMax;
    }
}
