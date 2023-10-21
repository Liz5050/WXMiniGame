import { ImageAsset, Sprite, SpriteFrame, Texture2D, assetManager } from "cc";
import Mgr from "./Mgr";

class LoaderVo {
    public url:string;
    public callBack:Function;
    public caller:any;
}

export class LoaderManager{
    private _waitingArr:LoaderVo[] = [];
    private _waitingDict:{[url:string]:LoaderVo} = {};
    private _spriteFrameCache:{[url:string]:SpriteFrame} = {};
    private _curLoaderCount = 0;
    private _maxCount = 5;//最大加载数
    public constructor(){
        this.Init();
    }

    public Init(){
        assetManager.downloader.maxConcurrency = 10;
        assetManager.downloader.maxRetryCount = 3;
        assetManager.downloader.retryInterval = 2000;
    }
    public LoadSprite(url:string,callBack?:Function,caller?:any){
        if(this._curLoaderCount >= this._maxCount){
            //缓存加载数据
            let vo = this._waitingDict[url];
            if(!vo){
                vo = new LoaderVo();
                vo.url = url;
                vo.callBack = callBack;
                vo.caller = caller;
                this._waitingDict[url] = vo;
                this._waitingArr.unshift(vo);
            }
            return;
        }
        this._curLoaderCount ++;
        assetManager.loadRemote<ImageAsset>(url,{ext: '.jpg'}, (err, imageAsset) => {
            let sp = this._spriteFrameCache[imageAsset.uuid];
            if(!sp){
                let tex = new Texture2D();
                tex.image = imageAsset;
                sp = new SpriteFrame();
                sp.texture = tex;
                imageAsset.addRef();
                this._spriteFrameCache[imageAsset.uuid] = sp;
            }
            sp.addRef();
            // console.log("加载成功" + url,imageAsset);
            if(callBack){
                if(caller){
                    callBack.apply(caller,sp);
                }
                else{
                    callBack(sp);
                }
            }
            this._curLoaderCount--;
            this.CheckWaitingList();
        })
    }

    private CheckWaitingList(){
        let vo = this._waitingArr.pop();
        if(vo){
            this.LoadSprite(vo.url,vo.callBack,vo.caller);
            this._waitingDict[vo.url] = null;
        }
    }

    public GetSpriteFrame(url:string,addRef:boolean = false){
        let spFrame = this._spriteFrameCache[url];
        if(spFrame && addRef){
            spFrame.addRef();
        }
        return spFrame;
    }

    public SetSpriteFrame(sp:Sprite,url:string){
        let frame = this.GetSpriteFrame(url,true);
        if(!frame){
            sp.node.active = false;
            this.LoadSprite(url,function(asset){
                sp.node.active = true;
                sp.spriteFrame = asset;
            });
        }
        else {
            sp.node.active = true;
            sp.spriteFrame = frame;
        }
    }

    public DecRefSpriteFrame(sp:Sprite,url:string){
        let spFrame = this._spriteFrameCache[url];
        if(spFrame){
            spFrame.decRef(false);
        }
        sp.spriteFrame = null;

        if (spFrame.refCount <= 0) {
            let texture = spFrame.texture as Texture2D;
            // 如果已加入动态合图，必须取原始的Texture2D
            if (spFrame.packable) {
                texture = spFrame.original?._texture as Texture2D;
            }
            if (texture) {
                delete this._spriteFrameCache[url]; // 删除映射表记录
                texture.image?.decRef();
                texture.destroy();
            }
			spFrame.destroy();
        }
    }
}