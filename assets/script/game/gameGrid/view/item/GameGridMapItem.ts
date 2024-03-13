import { Node, Prefab, instantiate, math } from "cc";
import Mgr from "../../../../manager/Mgr";

export class GameGridMapItem {
    private _col:number;
    private _row:number;
    // private _posX:number;
    // private _posY:number;
    private _itemEntity:Node;
    // private _itemSprite:Sprite;
    private _preview:Node;
    private _container:Node;
    // private _posArr:number[];

    private _isEmpty:boolean = true;
    private _playTween:boolean;
    private _skinRes:string;
    public consturctor(){

    }

    public init(col:number,row:number,container:Node){
        this._col = col;
        this._row = row;
        // this._posX = -450 + col * 100;
        // this._posY = 450 - row * 100;
        // this._posArr = [this._posX,this._posY];
        this._container = container;
        this.initUI();
    }

    private initUI(){
        let prefabAsset:Prefab = Mgr.loader.getBundleRes("scene","GameGrid3D/BlueGrid") as Prefab;
        if(prefabAsset){
            this._itemEntity = instantiate(prefabAsset);
            this._container.addChild(this._itemEntity);
            this._itemEntity.setPosition(this._col,0,this._row);
            // this._preview = this._itemEntity.getChildByName("preview");
            this.updateItemTexture();
        }
    }

    public updateItemTexture(){
        // if(!this._itemSprite) return;
        // let skinCfg = CacheManager.gameGrid.GetCurSkinCfg();
        // if(skinCfg && skinCfg.resName){
        //     if(skinCfg.resName != this._skinRes){
        //         Mgr.loader.SetSpriteByAtlas(this._itemSprite,"animal_square",skinCfg.resName);
        //         this._skinRes = skinCfg.resName;
        //     }
        // }
        // else{
        //     if(this._skinRes != "red_button07"){
        //         Mgr.loader.SetSpriteByAtlas(this._itemSprite,"common_ui","red_button07");
        //         this._skinRes = "red_button07";
        //     }
        // }
    }

    public get isEmpty():boolean{
        return this._isEmpty;
    }

    public setEmpty(bool:boolean,playTween:boolean = false,col_row:number = -1){
        this._isEmpty = bool;
        if(!bool){
            //非空
            if(this._itemEntity){
                this.clearTween();
                this._itemEntity.active = true;
                // if(!this._itemSprite.node.active)this._itemSprite.node.active = true;
                // if(this._preview.active) this._preview.active = false;
            }
            else{
                this.initUI();
            }
        }
        else{
            //空
            if(this._itemEntity){
                this._itemEntity.active = false;
                // if(this._preview.active) this._preview.active = false;
                // if(playTween){
                //     if(!this._playTween){
                //         this._playTween = true;
                //         let index:number = 0;
                //         if(col_row > 0){
                //             index = col_row == 1 ? this._row : this._col;
                //         }
                //         TweenManager.addTween(this._itemEntity).wait(50 * index).to({scaleX:2,scaleY:2},50).to({scaleX:0,scaleY:0},100).call(()=>{
                //             this._itemEntity.setScale(1,1);
                //             this._playTween = false;
                //             this._itemEntity.active = false;
                //         });
                //     }
                // }
                // else{
                //     this.clearTween();
                //     this._itemEntity.active = false;
                // }
            }
        }
    }

    public setPreview(isShow:boolean){
        if(this._itemEntity){
            this._itemEntity.active = true;
            // this._itemSprite.node.active = !this._isEmpty;
            // this._preview.active = isShow;
        }
    }

    private clearTween(){
        // if(this._playTween){
        //     TweenManager.removeTweens(this._itemEntity);
        //     this._itemEntity.setScale(1,1);
        //     this._playTween = false;
        // }
    }

    // public get position():number[] {
    //     return this._posArr;
    // }

    public get col():number{
        return this._col;
    }

    public get row():number{
        return this._row;
    }

    public getItemWorldPos():math.Vec3{
        if(!this._itemEntity){
            return null;
        }
        
        return this._itemEntity.getWorldPosition();
    }
}