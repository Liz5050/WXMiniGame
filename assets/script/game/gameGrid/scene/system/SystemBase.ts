import { EntityComponent } from "../components/EntityComponent";

export class SystemBase {

    protected _isStart:boolean = false;
    protected _components:EntityComponent[] = [];
    public start(){
        this._isStart = true;
    }

    public onUpdate(dt:number){
        if(!this._isStart) return;
        this.update(dt);
    }

    protected update(dt:number){

    }

    public stop(){
        this._isStart = false;
    }
}