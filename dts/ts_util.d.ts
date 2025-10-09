/**
 * 工具类型
 */
declare type nll = undefined | null;

declare type NULL = any;

type Keys<T> = { [K in keyof T]: K }[keyof T];
type KeyLikeValues<T> = { [K in keyof T]: T[K] extends string | number ? T[K] : never }[keyof T];

declare type Writabled<T> = {
    -readonly [P in keyof T]: T[P];
};

declare type WritabledRequired<T> = {
    -readonly [P in keyof T]-?: T[P];
};

declare type CFOR<T> = new () => T;

declare type FilterKeys<T extends { [index: string]: any }, FILTER> = {
    [K in keyof T]: T[K] extends FILTER ? K : never;
}[keyof T];

declare type ReverseFilterKeys<T extends { [index: string]: any }, FILTER> = {
    [K in keyof T]: T[K] extends FILTER ? never : K;
}[keyof T];

declare type EventVal<T> = {
    [K in keyof T]: T[K] extends string | number ? T[K] : never;
}[keyof T];

/**
 * 获取键值类型
 */
declare type ValueOf<T> = T[keyof T];

declare type UnionToIntersection<U> = (U extends any ? (K: U) => void : never) extends (K: infer I) => void ? I : never;

/**
 * 将交叉类型拍平
 * type Param = Prettify<{a:string}&{b:number}&{c:boolean}>
 * {a:string, b:number, c:boolean}
 */
declare type Prettify<T> = T extends infer U ? { [K in keyof U]: U[K] } : never;

type UnionRecords<DATA extends Array<Record<any, any>>> = Prettify<UnionToIntersection<DATA extends Array<infer ARR> ? ARR : never>>;

type StringifyA<T> = {
    [K in keyof T]: string;
};

type StrOrNum = String | string | Number | number;

/** 提取对象中值为 number 类型的键 */
type NumberKeys<T> = {
    [K in keyof T]: T[K] extends number ? K : never;
}[keyof T];

type TypeAlias<T> = T;
type ConstructorType<T> = new (...args: any[]) => TypeAlias<T>;

type ToPrimitive<T> = T extends string ? string : T extends number ? number : T extends boolean ? boolean : T;
type OwnKeys<T> = {
    [K in keyof T]: T[K] extends Function ? never : K;
}[keyof T];
type OwnProps<T> = Pick<T, OwnKeys<T>>;
type OwnPropsKeys<T> = keyof OwnProps<T>;
type OwnPropsValues<T> = T[OwnPropsKeys<T>];
type OwnPropsValuesPrimitive<T> = ToPrimitive<OwnPropsValues<T>>;
type OwnPropsValuesPrimitiveKeys<T> = {
    [K in keyof T]: T[K] extends OwnPropsValuesPrimitive<T> ? K : never;
}[keyof T];