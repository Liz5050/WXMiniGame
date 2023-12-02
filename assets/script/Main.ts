import { UIModuleEnum } from './enum/UIDefine';
import { MainMenu } from './game/MainMenu';
import { BaseUIView } from './game/base/BaseUIView';
import { LayerManager } from './manager/LayerManager';
export class Main extends BaseUIView {
	private _mainMenu:MainMenu;
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

	public onShowAfter(){
		this._mainMenu.active = true;
	}
}


