/**
 * 事件管理
 */
export class EventManager {
	private static events: any = {};

	/**
     * 添加消息监听
     * @param name 消息唯一标识
     * @param listener 侦听函数
     * @param listenerObj 侦听函数所属对象
     *
     */
	public static addListener(name: any, listener: Function, listenerObj: any): void {
		if (!name) {
			return;
		}
		if (this.events[name] == null) {
			this.events[name] = [];
		}

		if (!this.isExist(name, listener, listenerObj)) {
			this.events[name].push({ "listener": listener, "listenerObj": listenerObj });
		}
	}

	/**
     * 移除消息监听
     * @param name 消息唯一标识
     * @param listener 侦听函数
     * @param listenerObj 侦听函数所属对象
     */
	public static removeListener(name: any, listener: Function, listenerObj: any): void {
		if (!name) {
			return;
		}
		let arr: Array<any> = this.events[name];
		if (arr == null) {
			return;
		}

		let i: number = 0;
		let len: number = arr.length;
		for (i; i < len; i++) {
			if (arr[i]["listener"] == listener && arr[i]["listenerObj"] == listenerObj) {
				arr.splice(i, 1);
				break;
			}
		}

		if (arr.length == 0) {
			this.events[name] = null;
			delete this.events[name];
		}
	}

	/**
	 * 消息是否存在
	 */
	public static isExist(name: any, listener: Function, listenerObj: any): boolean {
		let isExist: boolean = false;
		let oneEvents: Array<any> = this.events[name];
		if (oneEvents != null) {
			for (let d of oneEvents) {
				if (d['listener'] == listener && d['listenerObj'] == listenerObj) {
					isExist = true;
					break;
				}
			}
		}
		return isExist;
	}

	/**
	 * 分派事件
	 */
	public static dispatch(name: any, ...params: any[]): void {
		if (!name) {
			return;
		}
		let oneEvents: Array<any> = this.events[name];
		if (oneEvents != null) {
			let event: any;
			for (let i: number = oneEvents.length - 1; i >= 0; i--) {
				event = oneEvents[i];
				if (event != null && event.hasOwnProperty("listener")) {
					event['listener'].apply(event['listenerObj'], params);
				}
			}
		}
	}

	public static clear(): void {
		this.events = {};
	}
}