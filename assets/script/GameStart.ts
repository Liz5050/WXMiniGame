import { _decorator, Component, Node, utils } from 'cc';
import { EventManager } from './manager/EventManager';
import { EventEnum } from './enum/EventEnum';
import Mgr from './manager/Mgr';
import { ControllerManager } from './manager/ControllerManager';
import { CacheManager } from './manager/CacheManager';
import { ConfigManager } from './manager/ConfigManager';
import { LoaderManager } from './manager/LoaderManager';
import { LayerManager } from './manager/LayerManager';
import { SDK } from './SDK/SDK';
import { Main } from './Main';
const { ccclass, property } = _decorator;

@ccclass('GameStart')
export class GameStart extends Component {
    private _main:Main;
    start() {
        Mgr.loader = new LoaderManager();
        LayerManager.init();
        
        this._main = new Main();
        EventManager.addListener(EventEnum.OnGameResLoadComplete,this.onGameResLoadComplete,this)
    }

    update(deltaTime: number) {
        
    }

    private onGameResLoadComplete(){
        ConfigManager.init();
        CacheManager.init();

        Mgr.Init();
        ControllerManager.init();
        
        SDK.Init();

        this._main.show();
        console.log("资源加载完成，显示主界面");
        // this._main.active = true;
    }
}


