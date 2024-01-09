import { AssetManager, ImageAsset, Sprite, SpriteAtlas, SpriteFrame, Texture2D, assetManager } from "cc";
import Mgr from "./Mgr";
import { resources } from "cc";
import { UIModuleEnum } from "../enum/UIDefine";

enum LoadType {
    Sprite = 1,
    Bundle,
    Sound,
    Resources,
}

class LoaderVo {
    public url:string;
    private _uuid:string;
    public onProgress:Function;
    // public caller:any;
    public loadType:LoadType;
    // public set url(u:string){
    //     this._uuid = assetManager.utils.getUuidFromURL(u);
    //     this._url = assetManager.utils.getUrlWithUuid(this._uuid);
    // }

    // public get url():string{
    //     return this._url;
    // }
    // public callComplete(...args){
    //     if(this.onComplete){
    //         if(this.caller){
    //             this.onComplete.apply(this.caller,...args);
    //         }
    //         else{
    //             this.onComplete(...args)
    //         }
    //     }
    // }
}
class LoadCompleteCallBack{
    public name:string;
    public compFunc:Function;
    public thisObj:any;

    public callBack(...args){
        if(this.thisObj){
            this.compFunc.apply(this.thisObj,...args);
        }
        else{
            this.compFunc(...args);
        }
    }
}

export class LoaderManager{
    private _waitingArr:LoaderVo[] = [];
    private _loadingDict:{[url:string]:LoaderVo} = {};//加载中
    private _spriteFrameCache:{[url:string]:SpriteFrame} = {};
    private _callbackDict:{ [url: string]: Array<LoadCompleteCallBack> } = {};
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

    private tryToLoad(){
        if(this._curLoaderCount < this._maxCount){
            let vo = this.GetLoaderVo();
            if(!vo){
                //暂无可加载的数据
                return;
            }
            this._loadingDict[vo.url] = vo;
            this._curLoaderCount ++;
            switch(vo.loadType){
                case LoadType.Sprite :
                    assetManager.loadRemote<ImageAsset>(vo.url,{ext: '.png'}, (err, imageAsset) => {
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
                        this.LoadComplete(vo,sp);
                    })
                    break;
                case LoadType.Bundle :
                    assetManager.loadBundle(vo.url,{
                        onFileProgress:vo.onProgress
                    },(err,bundle)=>{
                        this.LoadComplete(vo,err,bundle);
                    });
                    break;
                case LoadType.Resources :
                    resources.load(vo.url,
                    (finished)=>{
                        if(vo.onProgress){
                            vo.onProgress(finished);
                        }
                    },
                    (error,data)=>{
                        // console.log("Resources load complete",error,data);
                        this.LoadComplete(vo,error,data);
                    });
                    break;
            }
        }
    }

    private LoadComplete(vo:LoaderVo,...args){
        // vo.callComplete(...args);
        this.CompleteCall(vo.url,...args);
        this._curLoaderCount--;
        delete this._loadingDict[vo.url];
        this.tryToLoad();
    }

    private CompleteCall(name: string,...args):void{
        let calls:Array<LoadCompleteCallBack> = this._callbackDict[name];
        let cb:LoadCompleteCallBack;
        while (calls && calls.length){
            cb = calls.shift();//确保回调顺序
            cb.callBack(...args);
        }
    }

    private addCallback(data:{name: string, compFunc: Function, thisObj?: any}):void{
        let calls:Array<LoadCompleteCallBack> = this._callbackDict[data.name];
        if (!calls){
            calls = [];
            this._callbackDict[data.name] = calls;
        }

        //查重
        let cb:LoadCompleteCallBack;
        for (let i = 0; i < calls.length; i++) {
            cb = calls[i];
            if (cb.name == data.name && cb.compFunc == data.compFunc && cb.thisObj == data.thisObj)
                return;
        }
        let callBack = new LoadCompleteCallBack();
        callBack.name = data.name;
        callBack.compFunc = data.compFunc;
        callBack.thisObj = data.thisObj;
        calls.push(callBack);
    }

    private GetLoaderVo():LoaderVo {
        let vo = this._waitingArr.pop();
        return vo;
    } 

    private LoadSprite(url:string,option:{onComplete?:Function,onProgress?:Function},caller?:any){
        if(option.onComplete){
            this.addCallback({name:url, compFunc:option.onComplete, thisObj:caller});
        }
        if(this._loadingDict[url]){
            //加载中
            return;
        }

        let vo = new LoaderVo();
        vo.url = url;
        vo.onProgress = option.onProgress;
        vo.loadType = LoadType.Sprite;
        this._waitingArr.unshift(vo);

        this.tryToLoad();
    }

    //resources.load
    public LoadRes(url:string,option:{onComplete?:Function,onProgress?:Function},caller?:any){
        if(option.onComplete){
            this.addCallback({name:url, compFunc:option.onComplete, thisObj:caller});
        }
        if(this._loadingDict[url]){
            //加载中
            return;
        }
        let asset = resources.get(url); 
        if(asset){
            //已经加载过
            this.CompleteCall(url,asset);
            return;
        }
        let vo = new LoaderVo();
        vo.url = url;
        vo.onProgress = option.onProgress;
        vo.loadType = LoadType.Resources;
        this._waitingArr.unshift(vo);

        this.tryToLoad();
    }

    public LoadBundle(url:string,option:{onComplete?:Function,onProgress?:Function},caller?:any){
        if(option.onComplete){
            this.addCallback({name:url, compFunc:option.onComplete, thisObj:caller});
        }

        if(this._loadingDict[url]){
            //加载中
            console.log("已经在加载中" + url);
            return;
        }
        let bundle = assetManager.getBundle(url);
        if(bundle){
            //已经加载完成
            // console.log("资源已经加载过",url);
            let args = [null,bundle];
            this.CompleteCall(url,...args);
            return;
        }

        let vo = new LoaderVo();
        vo.url = url;
        vo.onProgress = option.onProgress;
        vo.loadType = LoadType.Bundle;
        this._waitingArr.unshift(vo);

        this.tryToLoad();
    }

    public SetSpriteByAtlas(sp:Sprite,atlasName:string,resName:string){
        this.LoadBundle("atlas",{onComplete:function(err,bundle:AssetManager.Bundle){
            if(bundle){
                // console.log("bundle加载成功",err,bundle)
                bundle.load(atlasName,SpriteAtlas,(err,atlas)=>{
                    if(err){
                        // console.log("SetSpriteByAtlas资源加载失败",atlasName,resName,atlas);                        
                        console.error(err);
                    }
                    else{
                        // console.log("SetSpriteByAtlas资源加载成功",atlasName,resName,atlas)
                        sp.spriteAtlas = atlas;
                        sp.spriteFrame = atlas.getSpriteFrame(resName);
                    }
                })  
            }
        }})
    }

    //加载bundle资源
    public LoadBundleRes(bundleName:string,resPath:string,callBack:Function){
        let asset = this.getBundleRes(bundleName,resPath);
        if(asset){
            callBack(asset);
        }
        else{
            this.LoadBundle(bundleName,{
                onComplete:(e,bundle)=>{
                    if(e){
                        console.error(e);
                    }
                    else{
                        bundle.load(resPath,(err,assetData)=>{
                            if(err) console.error(err);
                            else callBack(assetData);
                        })
                    }
                }
            });
        }
    }

    public LoadAudio(name:string,callBack:Function){
        this.LoadBundleRes("audio",name,callBack);
    }

    public LoadUIPrefab(moduleId:UIModuleEnum,viewName:string,callBack:Function){
        let url:string = UIModuleEnum[moduleId] + "/" + viewName;
        this.LoadBundleRes("ui",url,callBack);
    }

    public getBundleRes(bundleName:string,resPath:string){
        let bundle = assetManager.getBundle(bundleName);
        if(bundle){
            return bundle.get(resPath);
        }
        return null;
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
            this.LoadSprite(url,{
                onComplete:function(asset){
                    sp.node.active = true;
                    sp.spriteFrame = asset;
                }
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