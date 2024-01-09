import GameGridController from "../game/gameGrid/GameGridController";
import GameBallController from "../game/gameBall/GameBallController";
import GameShulteController from "../game/gameShulte/GameShulteController";
import { RankController } from "../game/rank/RankController";
import { ShopController } from "../game/shop/ShopController";
import GameHitController from "../game/gameHit/GameHitController";

/**配置管理 */
export class ControllerManager {
    public static shop:ShopController;
    public static gameShulte:GameShulteController;
    public static gameGrid:GameGridController;
    public static gameNum:GameBallController;
    public static rank:RankController;
    public static gameHit:GameHitController;
    public static init(){
        ControllerManager.shop = new ShopController();
        this.gameShulte = new GameShulteController();
        this.gameGrid = new GameGridController();
        this.gameNum = new GameBallController();
        this.rank = new RankController();
        this.gameHit = new GameHitController();
    }
}