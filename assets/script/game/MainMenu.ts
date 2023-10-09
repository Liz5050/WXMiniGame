import { _decorator, assetManager, Button, Component, ImageAsset, Node, Sprite, Texture2D, Toggle } from 'cc';
import { EventManager } from '../manager/EventManager';
import { EventEnum } from '../enum/EventEnum';
import { GameType } from '../enum/GameType';
import { GameState } from '../enum/GameState';
import Mgr from '../manager/Mgr';
import WXSDK from '../SDK/WXSDK';
import { CloudApi } from '../enum/CloudDefine';
const { ccclass, property } = _decorator;

@ccclass('MainMenu')
export class MainMenu extends Component {
    private _gameState:GameState;
    private _imgAvatar:Sprite;
    private _btnLogin:Node;
    update(deltaTime: number) {
        
    }

    public start(){
        let self = this;

        this._imgAvatar = this.node.getChildByPath("UserInfo/imgAvatar").getComponent(Sprite);

        let muteToggle:Toggle = this.node.getChildByName("muteToggle").getComponent(Toggle);
        let soundNormal:Node = muteToggle.node.getChildByName("normal");
        muteToggle.node.on(Toggle.EventType.TOGGLE,function(){
            soundNormal.active = !muteToggle.isChecked;
            Mgr.soundMgr.setMute(muteToggle.isChecked);
        });

        let btnShulte = this.node.getChildByName("btnShulte");
        btnShulte.on(Button.EventType.CLICK,function(){
            self.OnStartGame(GameType.Shulte);
        });
        let btnGridGame = this.node.getChildByName("btnGrid");
        btnGridGame.on(Button.EventType.CLICK,function(){
            self.OnStartGame(GameType.Grid);
            Mgr.soundMgr.play("game_start");
        });

        let btnNullify = this.node.getChildByName("btnNullify");
        let clickCount = 0;
        let targetNum = -1;
        btnNullify.on(Button.EventType.CLICK,function(){
            // self.OnStartGame(GameType.Nullify);
            let showTips:string = "别着急，已经在做了~";
            clickCount++;
            if(targetNum == -1){
                targetNum = 1 + Math.round(Math.random()*10);
            }
            if(clickCount >= targetNum + 20){
                showTips = "有事？vme50（vx：lizhi5050）";
                clickCount = 0;
                targetNum = 1 + Math.round(Math.random()*10);
            }
            else if(clickCount >= targetNum + 12){
                showTips = "休息一会儿吧~已经在加快速度了";
            }
            else if(clickCount >= targetNum + 11){
                self.OnStartGame(GameType.Nullify);
            }
            else if(clickCount >= targetNum + 10){
                showTips = "这么期待？给你看一眼？";
            }
            else if(clickCount >= targetNum){
                showTips = "别着急，已经在做了~";
            }
            WXSDK.showToast(showTips);
        });
        let openDatacontext = this.node.getChildByName("openDataContext");
        let btnRank = this.node.getChildByName("btnRank");
        btnRank.on(Button.EventType.CLICK,function(){
            openDatacontext.active = true;
            WXSDK.showRank("rank_" + GameType.Shulte);
        });

        let btnWorldRank = this.node.getChildByName("btnWorldRank");
        btnWorldRank.on(Button.EventType.CLICK,function(){
            if(WXSDK.UserInfo){
                WXSDK.showToast("正在开发接入中...");
                // WXSDK.GetAllUserGameData(GameType.Grid);
            }
            else{
                WXSDK.showToast("请先登录授权");
            }
        });
        
        let btnClose = openDatacontext.getChildByName("btnClose");
        btnClose.on(Button.EventType.CLICK,function(){
            openDatacontext.active = false;
        });
        let btnShulteRank = openDatacontext.getChildByName("btnShulteRank");
        btnShulteRank.on(Button.EventType.CLICK,function(){
            WXSDK.showRank("rank_" + GameType.Shulte);
        });

        let btnGridRank = openDatacontext.getChildByName("btnGridRank");
        btnGridRank.on(Button.EventType.CLICK,function(){
            WXSDK.showRank("rank_" + GameType.Grid);
        });

        let btnTest = this.node.getChildByName("btnTest");
        btnTest.on(Button.EventType.CLICK,function(){
            Mgr.sceneMgr.LoadScene("sceneTest");
        });

        this.AddEvent();
        this.SetGameState(GameState.Home);
        this.OnUserInfoUpdate();
    }

    private AddEvent(){
        EventManager.addListener(EventEnum.OnGameExit,this.OnGameExit,this);
        EventManager.addListener(EventEnum.OnUserInfoUpdate,this.OnUserInfoUpdate,this);
    }

    private OnUserInfoUpdate(){
        if(WXSDK.UserInfo){
            let self = this;
            assetManager.loadRemote<ImageAsset>(WXSDK.UserInfo.avatarUrl + "?aaa=aa.jpg", function (err, imageAsset) {
                console.log("avatar loadComplete")
                let texture = new Texture2D();
                texture.image = imageAsset;
                self._imgAvatar.node.active = true;
                self._imgAvatar.spriteFrame.texture = texture;
            })
        }
        else{
            this._imgAvatar.node.active = false;
        }
    }

    private OnStartGame(type:GameType){
        if(this._gameState == GameState.Playing){
            return;
        }
        this.SetGameState(GameState.Playing);
        EventManager.dispatch(EventEnum.OnGameStart,type);
    }

    private OnGameExit(){
        this.SetGameState(GameState.Home);
    }

    private SetGameState(state:GameState){
        if(state == GameState.Home){
            this.node.active = true;
        }
        else if(state == GameState.Playing){
            this.node.active = false;
        }
    }
}



