import { Component } from "cc";

export class BaseCCView extends Component{
    protected onLoad(): void {
        this.initUI();
    }   

    protected initUI(){
    }

    public setData(data:any,index:number){

    }

    public dispose(){
    }
}