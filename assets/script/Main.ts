import { SDK } from './SDK/SDK';
import { EventEnum } from './enum/EventEnum';
import { GameState } from './enum/GameState';
import { GameDefine, GameType } from './enum/GameType';
import { UIModuleEnum } from './enum/UIDefine';
import { MainMenu } from './game/MainMenu';
import { BaseUIView } from './game/base/BaseUIView';
import { EventManager } from './manager/EventManager';
import { LayerManager } from './manager/LayerManager';
export class Main extends BaseUIView {
	private _mainMenu:MainMenu;
	private _gameState:GameState;
	public constructor(){
		super(UIModuleEnum.main,"Main");
	}

	protected get parent(){
        return LayerManager.mainLayer;
    }

	protected initUI(){
		this._mainMenu = new MainMenu(this.getChildByName("MainMenu"));
		this._mainMenu.init();
	}

	protected initEvent(){
        EventManager.addListener(EventEnum.OnGameExit,this.OnGameExit,this);
		EventManager.addListener(EventEnum.OnGameStart,this.OnStartGame,this);
	}

	public onShowAfter(){
	}

	private OnStartGame(type:GameType){
        if(this._gameState == GameState.Playing){
            return;
        }
        this.SetGameState(GameState.Playing);
    }

    private OnGameExit(type:GameType){
        this.SetGameState(GameState.Home);
        if(type == GameType.Shulte){
            SDK.HideBannerAd();
        }
    }

    private SetGameState(state:GameState){
        if(state == GameState.Home){
            // this._mainMenu.active = true;
			this._rootNode.active = true;
        }
        else if(state == GameState.Playing){
            // this._mainMenu.active = false;
			this._rootNode.active = false;
        }
        this._gameState = state;
    }
}


