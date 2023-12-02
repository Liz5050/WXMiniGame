import { JsonAsset, assetManager, error, resources } from "cc";
import { ConfigManager } from "../manager/ConfigManager";

export class BaseConfig {
	protected sourceData: any;
	protected dataDict: any;
	protected tableName: string;
	protected pk: string;
	protected sep: string = "-";
	public configLength: number;

	/**
	 * @param tableName 表名
	 * @param pk 主键，多个以,隔开
	 */
	public constructor(tableName: string, pk: string) {
		this.tableName = tableName;
		this.pk = pk;
		this.sourceData = ConfigManager.Data[this.tableName];
	}

	public getDict(): any {
		if (this.dataDict == null) {
			// let jsonData = assetManager.cacheManager.getCache('config/' + this.tableName + "json"); 
			// if(!jsonData){
			// 	error("配置文件加载失败:",this.tableName);
			// 	return;
			// }
			this.configLength = this.sourceData ? this.sourceData.length : 0;
			this.dataDict = this.parseByPk(this.sourceData, this.pk);
            this.sourceData = null;
			
		}
		return this.dataDict;
	}

	public parseByPk(sourceData: any, pk: string): any {
		let data = {};
		if (sourceData) {
			let key: string = "";
			let pks: Array<string> = pk.split(",");
			for (let d of sourceData) {
				key = "";
				if (pks.length > 1) {//组合主键
					for (let k of pks) {
						if (d[k]) {
							key += d[k] + this.sep;
						} else {
							key += 0 + this.sep;
						}
					}
				} else {
					key = d[pk] ? d[pk] : 0;
				}
				data[key] = this.transform(d, data);
			}
		}
		return data;
	}

	public getByPk(value: any): any {
		var key: any = value;
		let dict = this.getDict();
		if (typeof value == "string") {
			key = "";
			let pks = value.split(",");
			if (pks.length > 1) {
				for (let k of pks) {
					key += k + this.sep;
				}
			} else {
				key = pks[0];
			}

		}
		return dict[key];
	}

	public getByPKParams(...params): any {
		return this.getByPk(params.join(","));
	}

	public select(condition: any): any {
		let data = [];
		let dict = this.getDict();
		for (let id in dict) {
			let d: any = dict[id];
			let ok: boolean = true;
			for (let key in condition) {
				if (d[key] != condition[key]) {
					ok = false;
				}
			}
			if (ok) {
				data.push(d);
			}
		}
		return data;
	}

    /**
     * 转换一条数据
     * @param oneData 当前条的数据
     * @param dataDict 整个数据
     * @returns {any}
     */
	protected transform(oneData: any, dataDict:any): any {
	    return oneData;
    }

}