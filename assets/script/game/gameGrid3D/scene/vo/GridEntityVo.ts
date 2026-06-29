import { EntityType } from "../utils/EntityUtil";
import EntityVo from "./EntityVo";

/** 地块归属阵营 */
export const enum GridOwner {
    /** 无归属 */
    None = 0,
    /** 玩家阵营 */
    Player = 1,
    /** 敌方阵营 */
    Enemy = 2,
}

/** 地块召唤配置 */
export interface GridSummonConfig {
    /** 召唤单位类型 */
    summonUnitType: EntityType;
    /** 单位阶段分支 ID */
    summonBranchId: number;
}

/**地图格子槽位数据（固定不动） */
export class GridEntityVo extends EntityVo{
    public col:number = 0;
    public row:number = 0;
    /** 是否为空 */
    public isEmpty:boolean = true;
    /** 是否为预览状态 */
    public isPreview:boolean = false;
    /** 是否为核心据点占用格 */
    public isCoreGrid: boolean = false;
    /** 是否配置为战斗格 */
    public isBattleGrid: boolean = false;
    /** 地块等级 */
    public tileLevel: number = 1;
    /** 地块升级进度 */
    public tileProgress: number = 0;
    /** 战斗阶段召唤单位类型 */
    public summonUnitType: EntityType = null;
    /** 战斗阶段召唤单位阶段 */
    public summonUnitStage: number = 1;
    /** 单位阶段分支 ID */
    public summonBranchId: number = 0;
    /** 本轮战斗是否已经完成基础召唤 */
    public hasSummonedThisBattle: boolean = false;
    /** 地块归属阵营 */
    public owner: GridOwner = GridOwner.None;

    public constructor(){
        super();
        this.type = EntityType.Grid;
    }

    public update(data:Partial<GridEntityVo>): void {
        super.update(data);
    }

    protected onInit(): void {
        super.onInit();
        this.col = this.pos.x;
        this.row = this.pos.z;
    }

    public get modelUrl(): string {
        return "gameGrid3D/BlueGrid";
    }

    public getShowName(): string {
        return `Grid_${this.col}_${this.row}`;
    }
}
