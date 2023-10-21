import { GameGridCache } from "../cache/GameGridCache";

export class CacheManager {
    private _gameGrid:GameGridCache;
    public constructor(){
        this.Init();
    }

    public Init(){
        this._gameGrid = new GameGridCache();
    }

    public Clear(){
        
    }

    public get gameGrid():GameGridCache{
        return this._gameGrid;
    }
}