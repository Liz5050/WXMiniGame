# 编码风格与代码规范

## 基本原则

- 优先遵循现有项目风格，避免在同一模块内混用多套命名和架构。
- 新增玩法应按 `Controller + View + Cache + Event + Prefab` 的现有模式接入。
- 不在业务代码中直接散落资源路径、层级路径和平台 API，优先通过 Manager、SDK、枚举常量封装。
- 当前 `strict` 为 `false`，新增代码仍应尽量补充明确类型，减少 `any` 扩散。

## 命名规范

当前项目常见命名：

- 类名：`PascalCase`，例如 `GameGridController`、`LoaderManager`。
- 方法名：项目中同时存在 `camelCase` 与 `PascalCase`，新增代码建议使用 `camelCase`，事件回调保留现有周边风格。
- 私有字段：下划线前缀，例如 `_gameStartView`、`_isShow`。
- 枚举：`PascalCase`，枚举值也多为 `PascalCase`。
- 事件名：`OnXxx` 风格，例如 `OnGameStart`、`OnPlayerInfoUpdate`。
- UI Prefab 名称：通常与 View 类名一致，例如 `GameWorldRankView.prefab` 对应 `GameWorldRankView.ts`。

## 文件组织规范

新增普通 UI 模块推荐结构：

```text
assets/script/game/example/
  ExampleController.ts
  view/
    ExampleView.ts

assets/game/ui/example/
  ExampleView.prefab
```

新增玩法推荐同步补充：

- `GameType`：新增玩法类型。
- `UIModuleEnum`：新增 UI 模块名。
- `ControllerManager`：创建对应 Controller。
- `GameDefine.getGameRes()`：声明首次进入前需要预加载的资源。
- `EventEnum` 或类型化事件：声明必要事件。

## View 编写规范

独立界面继承 `BaseUIView`：

```ts
export class ExampleView extends BaseUIView {
    public constructor() {
        super(UIModuleEnum.example, "ExampleView");
    }

    protected initUI() {
    }

    protected initEvent() {
    }

    public onShowAfter(param: any = null) {
    }
}
```

已有节点上的子视图继承 `BaseUISubView`：

```ts
this._subView = new ExampleSubView(this.getChildByName("ExampleSubView"));
this._subView.init();
```

注意事项：

- `initUI()` 只做节点缓存和 UI 事件绑定。
- `initEvent()` 只注册全局事件。
- `onShowAfter()` 处理每次打开时的参数刷新。
- `onHide()` 或 `hide()` 时注意停止定时器、动画、音效和事件监听。
- `getChildByName` 和 `getChildByPath` 依赖 Prefab 节点命名，重命名前应全局检索。

## Controller 编写规范

Controller 应只做调度，不承载复杂 UI 逻辑或数据计算。

推荐职责：

- 监听 `OnGameStart`、打开面板等全局事件。
- 懒创建对应 View。
- 调用 Cache 初始化玩法数据。
- 管理少量跨 View 的流程。

不推荐：

- 在 Controller 中直接操作大量节点。
- 在 Controller 中拼接复杂配置数据。
- 在 Controller 中直接调用平台 API，平台能力应走 `SDK`。

## Cache 编写规范

Cache 用于保存运行时数据、服务端返回数据、本地存储数据和玩法局内状态。

推荐职责：

- 维护当前玩法局内状态。
- 发起与该数据相关的 SDK/云接口请求。
- 更新数据后派发事件通知 View。
- 封装本地缓存读写。

注意事项：

- 服务端返回后再修改金币、皮肤等关键数据，避免客户端乐观更新造成状态不一致。
- 对外暴露读方法，减少 View 直接修改内部字段。
- 游戏开局数据应提供明确初始化方法，例如 `InitGameData()`、`initGameBallInfo()`。

## 事件规范

当前主事件枚举为 `EventEnum`。新增事件时：

- 命名使用 `On模块动作`，例如 `OnExampleDataUpdate`。
- 参数顺序应固定，并在事件声明或调用附近写明。
- 添加监听时传入 `this`，移除监听时使用同一函数引用和同一对象。
- View 隐藏或销毁时应考虑移除长期监听，避免隐藏界面继续响应事件。

后续若迁移到 `MessageCenter + GEvent`，应以模块为单位替换，不建议同一条业务链路同时派发两套事件。

## 资源路径规范

UI Prefab 加载路径由 `UIModuleEnum` 和 `viewName` 组合：

```text
assets/game/ui/{moduleName}/{viewName}.prefab
```

Bundle 资源加载建议统一通过 `Mgr.loader.LoadBundleRes(bundleName, resPath, callback)`，不要直接在业务层调用 `assetManager.loadBundle`。

## 注释与编码

项目中文件应统一使用 UTF-8 编码，避免不同编辑器或命令行环境读取中文时出现显示差异。

- 新增和修改文件统一使用 UTF-8。
- 新增注释保持简短，解释业务意图，不重复代码字面含义。
- 命令行查看中文内容时，优先显式指定 UTF-8 编码。

## TypeScript 建议

虽然项目未启用严格模式，新增代码仍建议：

- 给公开方法、事件参数、回调参数补充类型。
- 避免新增裸 `any`，必要时定义接口。
- 对异步回调中的 `err` 做判空处理。
- 使用 `private/protected/public` 明确访问范围。
- 平台全局对象 `wx`、`tt` 依赖声明文件，新增平台 API 前先确认 d.ts。
