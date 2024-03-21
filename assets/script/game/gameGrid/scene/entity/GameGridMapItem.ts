import { Component, Node, ParticleSystem, Vec3, _decorator, math, tween } from "cc";
import { EntityState, EntityType, EntityVo } from "../../vo/EntityVo";
import { BaseEntity } from "./BaseEntity";
import { CacheManager } from "../../../../manager/CacheManager";
const { ccclass, property } = _decorator;

@ccclass
export class GameGridMapItem extends BaseEntity {
    @property(Node) bodyNode: Node;
    @property(Node) preview: Node;
    private _col: number;
    private _row: number;
    private _isEmpty: boolean = true;
    private _playTween: boolean;
    private _skinRes: string;
    private _isPreview: boolean = false;

    public setPos(col: number, row: number) {
        this._col = col;
        this._row = row;
        this.node.setPosition(this._col, 0, this._row);
        this.initMapItem();
    }
    protected updateSub(dt: number): void {
        if(!this._vo) return;
        if(this._vo.state == EntityState.die && this._playState != EntityState.die){
            this.playDie();
            this._playState = this._vo.state;
        }
        if(this._vo.state == EntityState.idle){
            if(!this._vo.battleVo){
                let battleVo = CacheManager.gameGrid.findTarget(this._vo.pos,EntityType.Enemy);
                this._vo.battleVo = battleVo;
            }
        }
    }

    private initMapItem() {
        this.bodyNode.active = false;
        this.preview.active = false;
        this.updateItemTexture();
    }

    public onEntityVoUpdate(){
    }

    protected playDie(): void {
        this.setEmpty(true);
        console.log("gridItem playDie")
    }

    protected playHurt(): void {
        tween(this.bodyNode).to(0.1,{scale:new Vec3(0.2,1.2,0.5)}).to(0.1,{scale:new Vec3(1,1,1)}).start();
    }

    public updateItemTexture() {
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

    public get isEmpty(): boolean {
        return this._isEmpty;
    }

    public setEmpty(bool: boolean, playTween: boolean = false, col_row: number = -1) {
        this._isEmpty = bool;
        if (!bool) {
            //非空
            this.setState(EntityState.idle);
            this.clearTween();
            if (!this.bodyNode.active) this.bodyNode.active = true;
            if (this.preview.active) this.preview.active = false;
        }
        else {
            //空
            this.setState(EntityState.die);
            if (this.bodyNode.active) this.bodyNode.active = false;
            if (this.preview.active) this.preview.active = false;
            
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

    public setPreview(isShow: boolean) {
        if (this._isPreview === isShow) return;
        this._isPreview = isShow;
        this.preview.active = isShow;
    }

    private clearTween() {
        // if(this._playTween){
        //     TweenManager.removeTweens(this._itemEntity);
        //     this._itemEntity.setScale(1,1);
        //     this._playTween = false;
        // }
    }

    public get col(): number {
        return this._col;
    }

    public get row(): number {
        return this._row;
    }
}