import { Vec3 } from "cc";
import BaseSystem from "../BaseSystem";
import { CacheManager } from "db://assets/script/manager/CacheManager";
import { GEvent } from "db://assets/script/enum/GEvent";
import { dispatchMsg } from "db://assets/script/utils/MessageCenter";
import { GridEntityVo } from "../../vo/GridEntityVo";
import EntityVo from "../../vo/EntityVo";

/**
 * 我方单位生成系统。
 *
 * 职责：
 *   - 遍历棋盘上所有标记为战斗格（isBattleGrid = true）的 GridEntityVo。
 *   - 读取 summonUnitType、tileLevel、summonBranchId 等字段确定要生成的单位。
 *   - 通过 GameEntityLayer（或 GameFactory）创建单位实体并绑定对应 Vo。
 *   - 每格本轮只生成一次（通过 hasSummonedThisBattle 标记防止重复）。
 *
 * 不循环调用，只在战斗阶段开始时由 BattlePhaseController 触发一次 spawnAll()。
 * 若未来需要延迟分批生成，可在此处扩展队列逻辑。
 */
export default class BattleUnitSpawnSystem extends BaseSystem {

    /**
     * 一次性生成本轮所有我方战斗单位。
     * 由 BattlePhaseController.enter() 调用，不应在 update 中重复调用。
     */
    public spawnAll(): void {
        const grids = CacheManager.gameGrid3D.getBattleGridVos();
        const list: EntityVo[] = [];
        for (const grid of grids) {
            if (grid.hasSummonedThisBattle) continue;
            if (!grid.summonUnitType) continue;

            const vo = this.buildUnitVo(grid);
            if (!vo) continue;
            list.push(vo);
            CacheManager.gameGrid3D.markBattleGridSummoned(grid);
        }
        if (list.length > 0) {
            dispatchMsg(GEvent.OnGameGrid3DEntityInit, list);
        }
        console.log("[BattleUnitSpawnSystem] 单位生成完毕");
    }

    // ------------------------------------------------------------------ private

    /**
     * 根据战斗格数据构建对应的单位 Vo。
     * 地块等级决定单位阶段，分支 ID 决定单位职责方向。
     *
     * @param grid 战斗格 Vo
     * @returns 对应的单位 Vo（HeroVo 或其子类）
     */
    private buildUnitVo(grid: GridEntityVo): EntityVo {
        const pos = new Vec3(grid.pos.x, 0, grid.pos.z);
        return CacheManager.gameGrid3D.addEntity(grid.summonUnitType, {
            pos,
            level: grid.summonUnitStage,
        });
    }
}
