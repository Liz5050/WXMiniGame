import { EventTouch, Node, NodeEventType, Prefab, Sprite, Tween, instantiate, math, tween } from "cc";
import Mgr from "../../../manager/Mgr";
import { UIModuleEnum } from "../../../enum/UIDefine";
import { CacheManager } from "../../../manager/CacheManager";
import { EventManager } from "../../../manager/EventManager";
import { EventEnum } from "../../../enum/EventEnum";

export class OperationGridItem {
    private _touchMask:Node;
    private _preview:Node;
    private _previewPos:math.Vec3;
    private _previewScale:math.Vec3;
    private _previewX:number;//初始X位置
    private _previewY:number;//初始Y位置
    private _moveStartX:number;
    private _moveStartY:number;
    private _canMove:boolean;
    private _gridIndex:number;
    private _resType:number = -1;

    private _randomGrid:Node;
    private _lastRandomGrid:Node;
    private _gridList:Node[];
    private _btnGrid:Node;
    private _node:Node;
    private _prefabUrl:string;
    public constructor(node:Node) {
        this._node = node;
        this.initUI();        
    }

    private initUI(){
        this._preview = this._node.getChildByName("preview");
        this._previewPos = this._preview.getPosition(this._previewPos);
        this._previewScale = this._preview.getScale();
        this._previewX = this._previewPos.x;
        this._previewY = this._previewPos.y;
        

        let self = this;
        this._btnGrid = this._node.getChildByName("btnGrid")
        this._btnGrid.on(Node.EventType.TOUCH_CANCEL,function(){
            self.touchEnd();
        });
        
        this._btnGrid.on(NodeEventType.TOUCH_END,function(){
            self.touchEnd();
        });
        this._btnGrid.on(NodeEventType.TOUCH_START,function(event:EventTouch){
            let touchPos = event.getLocation();
            self.touchStart(touchPos.x,touchPos.y);
        });

        this._btnGrid.on(NodeEventType.TOUCH_MOVE,function(event:EventTouch){
            let pos = event.getLocation();
            self.touchMove(pos.x,pos.y);
        });
        
        this._touchMask = this._node.getChildByName("touchMask");
        this._touchMask.active = false;
    }

    private touchStart(startX:number,startY:number){
        if(this._resType == -1) return;
        if(this._canMove) return;
        this._canMove = true;
        EventManager.dispatch(EventEnum.OnGameSceneGridCreate,this._resType,startX,startY);
        Mgr.soundMgr.play("crrect_answer1",false);
    }

    private touchMove(touchX:number,touchY:number){
        if(this._resType == -1) return;
        if(this._canMove){
            EventManager.dispatch(EventEnum.OnGameSceneGridMove,touchX,touchY);
        }
    }

    private touchEnd(){
        if(this._resType == -1) return;
        if(this._canMove){
            this._canMove = false;
            EventManager.dispatch(EventEnum.OnGameSceneGridDrop,this._gridIndex);
        }
    }

    public ShowRight(){
        this._touchMask.active = true;
        this._preview.active = false;
        Mgr.soundMgr.play("crrect_answer2",false);
        // let self = this;
    }

    public ShowError(){
        // Mgr.soundMgr.play("error999");
        Mgr.soundMgr.play("mobile_phone_O",false);
        // TweenManager.removeTweens(this._preview);
        // TweenManager.addTween(this._preview).to({x:this._previewX, y:this._previewY,scaleX:1,scaleY:1},100);
    }

    public set gridIndex(index:number) {
        this._gridIndex = index;
    }

    public get gridIndex():number {
        return this._gridIndex;
    }

    public getCurGridInfo(){
        let scale = this._randomGrid.getScale();
        return {
            enable:!this._touchMask.active,
            url:this._prefabUrl,
            scaleX:scale.x,
            scaleY:scale.y,
        };
    }

    public updatePreviewGrid(gridInfo = null){
        if(gridInfo && !gridInfo.enable){
            this._touchMask.active = true;
            this._preview.active = true;
            if(this._gridList){
                for(let i = 0; i < this._gridList.length; i++){
                    this._gridList[i].active = false;
                }
            }
            return;
        }

        this._preview.active = true;
        this._touchMask.active = false;
        this._preview.setPosition(this._previewX,this._previewY);
        this._preview.setScale(1,1);
        let url:string
        if(gridInfo){
            url = gridInfo.url;
        }
        else {
            let resType:number = 1 + Math.round(Math.random() * 14);
            url = "PreviewGrid" + resType;
            this._resType = resType;
        }
        this._prefabUrl = url;
        Mgr.loader.LoadUIPrefab(UIModuleEnum.gameGrid,url,(prefab:Prefab)=>{
            this.updateView(prefab,gridInfo);
        });
    }

    private updateView(prefab:Prefab,gridInfo = null) {
        let node:Node;
        if(prefab){
            if(this._lastRandomGrid){
                this._lastRandomGrid.destroy();
                this._lastRandomGrid = null;
            }
            if(this._randomGrid){
                //保存上一个格子对象，用于完成3个的缓动效果
                this._lastRandomGrid = this._randomGrid;
                this._randomGrid.active = false;//隐藏上一个，否则会影响下一个格子的布局位置
            }
            node = instantiate(prefab);
            this._preview.addChild(node);
            this._randomGrid = node;
            
            let scaleX = 1;
            let scaleY = 1;
            if(gridInfo){
                scaleX = gridInfo.scaleX;
                scaleY = gridInfo.scaleY;
                node.setScale(gridInfo.scaleX,gridInfo.scaleY);
            }
            else {
                scaleX = Math.random() > 0.5 ? -1 : 1;
                scaleY = Math.random() > 0.5 ? 1 : -1;
                node.setScale(scaleX,scaleY);
            }

            let num = node.children.length;
            this._gridList = [];
            let skinCfg = CacheManager.gameGrid.GetCurSkinCfg()
            for(let i = 1; i <= num; i++){
                let grid:Node = node.getChildByName("grid" + i);
                grid.setScale(scaleX,scaleY);
                let sp = grid.getComponent(Sprite);
                if(skinCfg && skinCfg.resName){
                    Mgr.loader.SetSpriteByAtlas(sp,"animal_square",skinCfg.resName);
                }
                else{
                    Mgr.loader.SetSpriteByAtlas(sp,"common_ui","red_button09");
                }
                this._gridList.push(grid);
            }
        }
        else{
            console.log("找不到资源");
        }
    }
}