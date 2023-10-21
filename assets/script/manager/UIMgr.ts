import { BaseView } from "../game/base/BaseView";

export class UIMgr {
    private _uiList = {};
    public constructor(){

    }

    public OpenUI(viewName:string){
        // let ui = UIMgr.GetUI(viewName);
    }

    public GetUI(viewName:string):BaseView{
        let ui = this._uiList[viewName];
        if(!ui){
            // ui = 
        }
        return
    }

    public CloseUI(){

    }
}