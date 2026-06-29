import { CameraType, Root3D } from "db://assets/script/Root3D";
import { GEvent } from "db://assets/script/enum/GEvent";
import { dispatchMsg } from "db://assets/script/utils/MessageCenter";
import BasePhaseController from "./BasePhaseController";

/**
 * 构建阶段控制器。
 *
 * 职责：
 *   - 进入构建阶段：恢复棋盘交互、重置拖拽与预览状态、切换至构建视角。
 *   - 退出构建阶段：清理拖拽残留、隐藏预览、关闭地块配置 UI。
 *   - 响应玩家点击格子时打开地块配置 UI（单位类型、分支选择等）。
 *
 * 不持有战斗逻辑，不直接操作单位实体。
 */
export default class BuildPhaseController extends BasePhaseController {
    /**
     * 进入构建阶段。
     * 由 GameGrid3DPhaseController 在切换到 Build 阶段时调用。
     */
    protected onEnter(): void {
        this.resetDragAndPreview();
        this.showBuildUI();
        Root3D.instance && Root3D.instance.switchCamera(CameraType.TopView);
        // TODO: 隐藏所有战斗单位模型，改为图标表现
    }

    /**
     * 退出构建阶段。
     * 由 GameGrid3DPhaseController 在离开 Build 阶段时调用。
     */
    protected onExit(): void {
        this.resetDragAndPreview();
        this.hideBuildUI();
    }

    // ------------------------------------------------------------------ private

    /** 重置拖拽状态与地块预览 */
    private resetDragAndPreview(): void {
        dispatchMsg(GEvent.OnGameGrid3DGridMoveCancel);
    }

    /** 显示构建阶段 UI（候选方块栏、地块配置入口等） */
    private showBuildUI(): void {
        dispatchMsg(GEvent.OnGameGrid3DBuildPhaseEnter);
    }

    /** 隐藏构建阶段 UI */
    private hideBuildUI(): void {
        dispatchMsg(GEvent.CloseGameGrid3DBuildView);
        dispatchMsg(GEvent.OnGameGrid3DBuildPhaseExit);
    }
}
