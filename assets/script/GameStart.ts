import { _decorator, Component, director, game, Scheduler } from 'cc';
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
import { GameLoadingView } from './common/loading/GameLoadingView';
import TweenManager from './common/TweenManager';
const { ccclass, property } = _decorator;

//test

@ccclass('GameStart')
export class GameStart extends Component {
    private _main:Main;
    private _frameSec:number;//1帧多少秒
    private _deltaTime:number = 0;
    private _scheduler:Scheduler;
    start() {
        Mgr.loader = new LoaderManager();
        LayerManager.init();
        
        this._main = new Main();
        EventManager.addListener(EventEnum.OnGameResLoadComplete,this.onGameResLoadComplete,this);
        EventManager.addListener(EventEnum.OnUILoading,this.onUILoading,this);
        EventManager.addListener(EventEnum.OnUILoadComplete,this.onUILoadComplete,this);

        this._frameSec = 1 / Number(game.frameRate);
        this._scheduler = director.getScheduler();
        this._scheduler.schedule(this.gameUpdate,this,0);
        // this._scheduler.setTimeScale(1);
        console.log("帧率：" + game.frameRate)
        this._deltaTime = game.totalTime;
    }

    private gameUpdate(dt:number){
        TweenManager.Update(dt);
        // console.log("game.frameTime : " + game.frameTime)
        // if(game.totalTime - this._deltaTime >= dt){
        //     // console.log("gameUpdate:" + this._deltaTime);
        //     this._deltaTime = game.totalTime;
        // }
    }

    update(deltaTime: number) {
        
    }

    private onUILoading(){
        GameLoadingView.showLoading();
    }

    private onUILoadComplete(){
        GameLoadingView.hideLoading();
    }

    private onGameResLoadComplete(){
        ConfigManager.init();
        CacheManager.init();
        CacheManager.game.scheduler = this._scheduler;

        Mgr.Init();
        ControllerManager.init();
        
        SDK.Init();

        this._main.show();
        console.log("资源加载完成，显示主界面");
        // this._main.active = true;
    }
}


