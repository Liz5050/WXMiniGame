import { GameType } from "../../enum/GameType";
import { EventEnum } from "../../enum/EventEnum";
import { EventManager } from "../../manager/EventManager";
import { GameShulte } from "./view/GameShulte";

export default class GameShulteController {
    private _gameShulte:GameShulte;
    public constructor(){
        this.init();
    }

    private init(){
        EventManager.addListener(EventEnum.OnGameStart,this.onGameStart,this);
        EventManager.addListener(EventEnum.OnGameExit,this.OnGameExit,this);
    }

    private onGameStart(type:GameType):void {
        if(type != GameType.Shulte) return;
        if(!this._gameShulte){
            this._gameShulte = new GameShulte();
            //GameUI.FindChild(engine.game.activeScene2D.root,"Main/GameManager/GameContainer/GameShulte");
        }
        this._gameShulte.show();
    }

    private OnGameExit(type:GameType){
        if(type == GameType.Shulte){
            this._gameShulte.hide();
        }
    }
}