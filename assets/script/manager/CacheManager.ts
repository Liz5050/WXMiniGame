import { GameBallCache } from "../cache/GameBallCache";
import { GameGridCache } from "../cache/GameGridCache";
import { GameShopCache } from "../cache/GameShopCache";
import { PlayerCache } from "../cache/PlayerCache";

export class CacheManager {
    private static _gameGrid:GameGridCache;
    private static _shop:GameShopCache;
    private static _player:PlayerCache;
    private static _gameBall:GameBallCache;
    public constructor(){
    }

    public static init(){
        this._gameGrid = new GameGridCache();
        this._shop = new GameShopCache();
        this._player = new PlayerCache();
        this._gameBall = new GameBallCache();
    }

    public static clear(){
        
    }

    public static get gameGrid():GameGridCache{
        return this._gameGrid;
    }

    public static get shop():GameShopCache{
        return this._shop;
    }

    public static get player():PlayerCache{
        return this._player;
    }

    public static get gameBall():GameBallCache{
        return this._gameBall;
    }
}