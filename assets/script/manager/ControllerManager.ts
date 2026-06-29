import GameGridController from "../game/gameGrid/GameGridController";
import GameGrid3DController from "../game/gameGrid3D/GameGrid3DController";
import GameBallController from "../game/gameBall/GameBallController";
import GameShulteController from "../game/gameShulte/GameShulteController";
import { RankController } from "../game/rank/RankController";
import { ShopController } from "../game/shop/ShopController";
import GameHitController from "../game/gameHit/GameHitController";
import { SideBarRewardController } from "../game/sideBarReward/SideBarRewardController";

/**配置管理 */
export class ControllerManager {
    public static shop:ShopController;
    public static gameShulte:GameShulteController;
    public static gameGrid:GameGridController;
    public static gameGrid3D:GameGrid3DController;
    public static gameNum:GameBallController;
    public static rank:RankController;
    public static gameHit:GameHitController;
    public static sideBar:SideBarRewardController;
    public static init(){
        this.shop = new ShopController();
        this.gameShulte = new GameShulteController();
        this.gameGrid = new GameGridController();
        this.gameGrid3D = new GameGrid3DController();
        this.gameNum = new GameBallController();
        this.rank = new RankController();
        this.gameHit = new GameHitController();
        this.sideBar = new SideBarRewardController();
    }
}
