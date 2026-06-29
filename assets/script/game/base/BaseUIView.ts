import { Button,Prefab, instantiate, AssetManager, Game } from "cc";
import { BaseView } from "./BaseView";
import { UIModuleEnum } from "../../enum/UIDefine";
import { LayerManager } from "../../manager/LayerManager";
import Mgr from "../../manager/Mgr";
import { Node } from "cc";
import { Animation } from "cc";
import { GameLoadingView } from "../../common/loading/GameLoadingView";
import { EventManager } from "../../manager/EventManager";
import { EventEnum } from "../../enum/EventEnum";
import { addObserver, removeObserver } from "../../utils/MessageCenter";

export class BaseUIView extends BaseView {
    private _onShowParam:any;
    protected _moduleId:UIModuleEnum;
    protected _viewName:string;
    protected _moduleName:string;
    protected _isShow:boolean = false;
    protected _isLoading:boolean = false;
    protected _cancelLoad:boolean = false;//加载中关闭界面标识
    protected _subviewDict:any = {};
    protected _effectList:any = {};
    private _curEffectIdx:number = 0;
    public constructor(moduleId:UIModuleEnum,viewName:string){
        super();
        this._viewName = viewName;
        this._moduleId = moduleId;
        this._moduleName = UIModuleEnum[moduleId];
    }

    protected get parent(){
        return LayerManager.popupLayer;
    }

    public show(param:any = null){
        if(this._isLoading) return;
        this._onShowParam = param;
        if(this._isShow){
            //显示中
            this.onShow();
        }
        else{
            if(this._isInit){
                this.parent.addChild(this._rootNode);
                this.onShow();
                addObserver(this);
            }
            else{
                this._isLoading = true;
                console.log("开始加载UI:" + this._viewName)
                if(this._viewName != "GameLoadingView"){
                    EventManager.dispatch(EventEnum.OnUILoading);
                }
                Mgr.loader.LoadUIPrefab(this._moduleId,this._viewName,(prefab:Prefab)=>{
                    this._isLoading = false;
                    EventManager.dispatch(EventEnum.OnUILoadComplete);
                    if(this._cancelLoad){
                        this._cancelLoad = false;
                        return;
                    }
                    if(!this._isInit){
                        let viewNode = instantiate(prefab);
                        this.initView(viewNode);
                    }
    
                    this.parent.addChild(this._rootNode);
                    this.onShow();
                },"ui");
            }
        }
    }

    protected onShow(){
        super.onShow();
        this._isShow = true;
        this.onShowAfter(this._onShowParam);
        this._onShowParam = null;
    }

    public onShowAfter(param:any = null){

    }

    public hide(isDestroy:boolean = false){
        removeObserver(this);
        if(this._isLoading){
            //取消加载
            this._cancelLoad = true;
            return;
        }
        if(!this._isShow){
            return;
        }
        this._rootNode.removeFromParent();
        this._isShow = false;
        this.onHide();
        if(isDestroy){
            this.destroy();
        }
    }

    protected destroy(){
    }

    protected addCloseHandler(nodeUrl:string){
        let node = this.getChildByName(nodeUrl);
        if(!node){
            node = this.getChildByPath(nodeUrl);
        }
        node.on(Button.EventType.CLICK,this.hide,this);
    }

    protected showEffect(effectName:string,parent:Node,posX:number = 0,posY:number = 0){
        let list = this._effectList[effectName];
        if(!list){
            list = [];
            this._effectList[effectName] = list;
        }
        if(list.length >= 3){
            //相同特效最多同时播放3个
            let effect = list[this._curEffectIdx];
            if(parent){
                parent.addChild(effect);
            }
            else{
                this._rootNode.addChild(effect);
            }
            effect.setPosition(posX,posY);
            effect.getComponent(Animation).play();
            this._curEffectIdx ++;
            if(this._curEffectIdx >= 3){
                this._curEffectIdx = 0;
            }
        }
        else{
            Mgr.loader.LoadBundleRes("effect",effectName,(prefab:Prefab)=>{
                if(prefab){
                    let effect = instantiate(prefab);
                    if(parent){
                        parent.addChild(effect);
                    }
                    else{
                        this._rootNode.addChild(effect);
                    }
                    effect.setPosition(posX,posY);
                    list.push(effect);
                    // effect.getComponent(Animation).play();
                }
            });
        }
    }

    protected getModuleRes(resPath:string,callBack){
        Mgr.loader.LoadUIPrefab(this._moduleId,resPath,(prefab:Prefab)=>{
            callBack(prefab);
        });
    }
}