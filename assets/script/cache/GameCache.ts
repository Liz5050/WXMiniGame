import { Scheduler, director, game } from "cc";

export class GameCache{
    private _gameSpeed:number = 1;
    public scheduler:Scheduler;
    private oldTick
    public constructor(){
        this.oldTick = director.tick;
        director.tick = (dt: number) => {
            this.oldTick.call(director, dt * this._gameSpeed);
        }
    }

    public setTimeScale(scaler){
        this.scheduler.setTimeScale(scaler);
    }
    public setGameSpeed(speed:number){
        this.setTimeScale(speed);
        director.setGameSpeed(speed);
        this._gameSpeed = speed;
    }

    public get gameSpeed():number{
        return this._gameSpeed;
    }

    public get timeScale():number{
        return 1 / this._gameSpeed;
    }
}