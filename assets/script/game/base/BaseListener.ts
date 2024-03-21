import { EventManager } from "../../manager/EventManager";

/**
 * 事件监听
 */
export class BaseListen {
	private listens: Array<any>;

    /**
     * 构造函数
     */
	public constructor() {
		this.listens = [];
	}

    /**
     * 清空处理
     */
	public clear() {
		this.listens = [];
	}

    /**
     * 添加消息监听
     * @param name 消息唯一标识
     * @param type 消息类型
     * @param listener 侦听函数
     * @param listenerObj 侦听函数所属对象
     *
     */
	public add(name: any, type: number, listener: Function, listenerObj: any): void {
		EventManager.addListener(name, listener, listenerObj);
		this.listens.push({ "name": name, "type": type, "listener": listener, "listenerObj": listenerObj });
	}

    /**
     * 移除消息监听
     * @param name 消息唯一标识
     * @param listener 侦听函数
     * @param listenerObj 侦听函数所属对象
     */
	public remove(name: any, listener: Function, listenerObj: any): void {
		EventManager.removeListener(name, listener, listenerObj);

		for (var i: number = 0; i < this.listens.length; i++) {
			if (this.listens[i]["listener"] == listener && this.listens[i]["listenerObj"] == listenerObj) {
				this.listens.splice(i, 1);
				break;
			}
		}
	}

    /**
     * 移除某一对象的所有监听
     * @param listenerObj 侦听函数所属对象
     */
	public removeAll(listenerObj: any): void {
		for (let d of this.listens) {
			EventManager.removeListener(d["name"], d["listener"], d["listenerObj"]);
		}
		this.listens = [];
	}

	/**
	 * 根据类型删除
	 */
	public removeByType(type: number): void {
		var removes: Array<any> = [];
		for (let d of this.listens) {
			if (d["type"] == type) {
				EventManager.removeListener(d["name"], d["listener"], d["listenerObj"]);
				removes.push(d);
			}
		}
		for(let d of removes){
			this.listens.splice(this.listens.indexOf(d), 1);
		}
	}

	public hide(): void {
		this.removeByType(1);
	}

	public destroy(): void {
		this.removeByType(1);
	}
}