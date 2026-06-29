import { GameType } from "../../enum/GameType";
import { EventEnum } from "../../enum/EventEnum";
import { EventManager } from "../../manager/EventManager";
import Mgr from "../../manager/Mgr";
import { CacheManager } from "../../manager/CacheManager";
import { addObserver, removeObserver, msg, dispatchMsg } from "../../utils/MessageCenter";
import { GEvent } from "../../enum/GEvent";
import { GameBuildHeroView } from "./view/GameBuildHeroView";
import { BaseEntity } from "./scene/entity/BaseEntity";
import { LayerType } from "./scene/layer/LayerType";
import GameGrid3DView from "./view/GameGrid3DView";
import GameGrid3DPhaseController, { GamePhase } from "./scene/phase/GameGrid3DPhaseController";
import { GameGrid3DRoundType } from "../../cache/GameGrid3DCache";
import type { IGameGrid3DBattleResult } from "./event/GameGrid3DEvent";

export default class GameGrid3DController {
    private _view: GameGrid3DView;
    private _buildHeroView: GameBuildHeroView;
    private _phaseController: GameGrid3DPhaseController;
    private _hasEnteredInitialPhase: boolean = false;

    public constructor() {
        this._phaseController = new GameGrid3DPhaseController();
        this.init();
    }

    private init(): void {
        addObserver(this);
    }

    @msg(GEvent.OnGameResAllReady)
    private onGameResAllReady(type: GameType): void {
        if (type !== GameType.Grid3D) return;
        CacheManager.gameGrid3D.initGameData();
        this._hasEnteredInitialPhase = false;
        this.onGameStart();
    }

    private onGameStart(): void {
        Mgr.loader.LoadBundleRes("scene", "gameGrid3D/GameGridMap", () => {
            if (!this._view) {
                this._view = new GameGrid3DView();
            }
            this._view.show();
            dispatchMsg(GEvent.OnGameStart,GameType.Grid3D);
        });
    }

    @msg(GEvent.OnGameGrid3DSceneReady)
    private onSceneReady(): void {
        CacheManager.gameGrid3D.sceneReady = true;
        if (this._hasEnteredInitialPhase) return;
        this._hasEnteredInitialPhase = true;
        this._phaseController.switchToBuild();
    }

    @msg(GEvent.OnGameGrid3DStartBattle)
    private onStartBattle(): void {
        if (CacheManager.gameGrid3D.roundType !== GameGrid3DRoundType.Ready) return;
        this._phaseController.switchToBattle();
    }

    @msg(GEvent.OnGameGrid3DBattleResult)
    private onBattleResult(result: IGameGrid3DBattleResult): void {
        if (!result) return;
        if (result.isVictory) {
            this._phaseController.switchToBuild();
            return;
        }
        this._phaseController.switchPhase(GamePhase.Settlement);
    }

    @msg(GEvent.OpenGameGrid3DBuildView)
    private openGameBuildView(entity: BaseEntity): void {
        if (!this._buildHeroView) {
            this._buildHeroView = new GameBuildHeroView();
        }
        this._buildHeroView.show(entity);
    }

    @msg(GEvent.CloseGameGrid3DBuildView)
    private closeGameBuildView(): void {
        this._buildHeroView && this._buildHeroView.hide();
    }

    public getLayer(type:LayerType){
        return this._view && this._view.getLayer(type);
    }

    public dispose(): void {
        removeObserver(this);
        this._phaseController && this._phaseController.dispose();
        this._phaseController = null;
    }
}
