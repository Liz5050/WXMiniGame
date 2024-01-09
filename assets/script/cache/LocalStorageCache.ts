import { sys } from "cc";

export class LocalStorageCache {

    private _storageDict:any = {};
    public constructor() {

    }

    public getStorage(key:string){
        let data = this._storageDict[key];
        if(!data){
            let storageItem = sys.localStorage.getItem(key);
            if(storageItem){
                data = JSON.parse(storageItem);
            }
        }
        return data;
    }

    public setStorage(key:string,data:any){
        sys.localStorage.setItem(key,JSON.stringify(data))
    }
}