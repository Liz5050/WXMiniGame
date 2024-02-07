import {sys} from "cc";

export class StorageCache {

    // 角色标识符
    private _roleKey: string = "";

    public init() {
    }

    /** 设置角色标识符 */
    public setRoleKey(roleKey: string) {
        this._roleKey = roleKey;
    }

    /**
     * 移除缓存
     * @param key
     * @param bindingRole
     */
    remove(key: string, bindingRole: boolean = false) {
        bindingRole ? sys.localStorage.removeItem(key + this._roleKey) : sys.localStorage.removeItem(key);
    }

    /**
     * 保存数据到本地
     * @param key
     * @param value
     * @param bindingRole 是否跟角色绑定
     */
    setString(key: string, value: string, bindingRole: boolean = false) {
        bindingRole ? sys.localStorage.setItem(key + this._roleKey, value) : sys.localStorage.setItem(key, value);
    }

    /**
     * 读取本地数据
     * @param key
     * @param defaultValue
     * @returns
     */
    getString(key: string, defaultValue?: string, bindingRole: boolean = false): string {
        return bindingRole
            ? sys.localStorage.getItem(key + this._roleKey) || defaultValue
            : sys.localStorage.getItem(key) || defaultValue;
    }

    /**
     * 保存数据到本地
     * @param key
     * @param value
     * @param bindingRole
     */
    setNumber(key: string, value: number, bindingRole: boolean = false) {
        bindingRole
            ? sys.localStorage.setItem(key + this._roleKey, String(value))
            : sys.localStorage.setItem(key, String(value));
    }

    /**
     * 读取本地数据
     * @param key
     * @param defaultValue
     * @param bindingRole
     * @returns
     */
    getNumber(key: string, defaultValue: number = 0, bindingRole: boolean = false): number {
        const value = bindingRole ? sys.localStorage.getItem(key + this._roleKey) : sys.localStorage.getItem(key);
        if (value == null || value == "" || value == undefined) {
            return defaultValue;
        } else {
            return isNaN(Number(value)) ? defaultValue : Number(value);
        }
    }

    /**
     * 保存数据到本地
     * @param key
     * @param bool
     * @param bindingRole
     */
    setBoolean(key: string, bool: boolean, bindingRole: boolean = false) {
        bindingRole
            ? sys.localStorage.setItem(key + this._roleKey, bool ? "TRUE" : "FALSE")
            : sys.localStorage.setItem(key, bool ? "TRUE" : "FALSE");
    }

    /**
     * 读取本地数据
     * @param key
     * @param defaultValue
     * @param bindingRole
     * @returns
     */
    getBoolean(key: string, defaultValue: boolean = false, bindingRole: boolean = false): boolean {
        if (defaultValue) {
            return bindingRole
                ? sys.localStorage.getItem(key + this._roleKey) == "FALSE"
                    ? false
                    : true
                : sys.localStorage.getItem(key) == "FALSE"
                ? false
                : true;
        } else {
            return bindingRole
                ? sys.localStorage.getItem(key + this._roleKey) == "TRUE"
                    ? true
                    : false
                : sys.localStorage.getItem(key) == "TRUE"
                ? true
                : false;
        }
    }

    /**
     * 保存数据到本地
     * @param key
     * @param list
     * @param bindingRole
     */
    setList(key: string, list = [], bindingRole: boolean = false) {
        let t_str = JSON.stringify(list);
        bindingRole ? sys.localStorage.setItem(key + this._roleKey, t_str) : sys.localStorage.setItem(key, t_str);
    }

    /**
     * 读取本地数据
     * @param key
     * @param defaultValue
     * @param bindingRole
     * @returns
     */
    getList(key: string, defaultValue = [], bindingRole: boolean = false): any[] {
        let value;
        if (bindingRole) {
            value = sys.localStorage.getItem(key + this._roleKey);
        } else {
            value = sys.localStorage.getItem(key);
        }

        if (value == null || value == "" || value == undefined) {
            return defaultValue;
        } else {
            return JSON.parse(value);
        }
    }
}
