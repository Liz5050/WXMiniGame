import { Scheduler, director } from "cc";

export class GameCache{
    private _gameSpeed:number = 1;
    public scheduler:Scheduler;
    public constructor(){

    }

    public setTimeScale(scaler){
        this.scheduler.setTimeScale(scaler);
    }
    public setGameSpeed(speed:number){
        // director.setGameSpeed(speed);
        this._gameSpeed = speed;
    }

    public get gameSpeed():number{
        return this._gameSpeed;
    }

    public get timeScale():number{
        return 1 / this._gameSpeed;
    }
}