import { GameType } from "../../enum/GameType";
import { EventEnum } from "../../enum/EventEnum";
import { EventManager } from "../../manager/EventManager";
import { Node, utils } from "cc";
import WXSDK from "../../SDK/WXSDK";

export default class GameShulteController {
    private _gameShulte:Node;
    public constructor(){
        this.init();
    }

    private init(){
        EventManager.addListener(EventEnum.OnGameStart,this.onGameStart,this);
    }

    private onGameStart(type:GameType):void {
        if(type != GameType.Shulte) return;
        if(!this._gameShulte){
            this._gameShulte = utils.find("Canvas/Main/Game/GameShulte");
            //GameUI.FindChild(engine.game.activeScene2D.root,"Main/GameManager/GameContainer/GameShulte");
        }
        this._gameShulte.active = true;
        // WXSDK.ShowBannerAd();
    }
}