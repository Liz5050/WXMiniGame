(function () {
    "use strict";

    const GRID_SIZE = 10;
    const CORE_MIN = 4;
    const CORE_MAX = 5;
    const LINE_EXP_TO_LEVEL = GRID_SIZE;
    const INITIAL_GOLD = 36;
    const MAX_CORE_HP = 100;
    const SHAPE_REFRESH_COST = 2;
    const FREE_BATTLE_GRID_CREDITS = 0;
    const BATTLE_GRID_COST = 12;
    const CHANGE_UNIT_COST = 4;
    const BASE_COMMAND_LIMIT = 3;
    const MAX_COMMAND_LIMIT = 6;
    const COMMAND_LIMIT_ROUND_STEP = 3;
    const MAX_CELL_CHARGE = 12;
    const MAX_CELL_MASTERY = 30;
    const MAX_BURST_READY = 3;
    const STAGE_TWO_CHARGE = 2;
    const STAGE_THREE_CHARGE = 6;
    const CORE_CENTER = { x: 5, y: 5 };
    const HERO_AGGRO_RANGE = GRID_SIZE * 1.6;
    const MIN_ENEMY_SPAWN_INTERVAL = 0.12;
    const MAX_ENEMY_SPAWN_INTERVAL = 0.45;
    const BUILD_ACTION_COST = 1;
    const BUILD_ACTION_BASE = 2;
    const BUILD_ACTION_MAX = 4;
    const BUILD_ACTION_ROUND_STEP = 4;
    const CV_REFERENCE_TIME = 8;
    const CV_PER_GOLD = 5.2;
    const STABLE_COEFFICIENT = 1.15;
    const DEFENSE_HP_CV_WEIGHT = 0.12;
    const ENEMY_HP_CV_WEIGHT = 0.45;
    const DPS_CV_WEIGHT = 1;
    const RANGE_CV_WEIGHT = 0.18;
    const MOBILITY_CV_WEIGHT = 0.12;
    const ENEMY_MIN_HITS_TO_KILL = 3.1;
    const ENEMY_MAX_HITS_TO_KILL = 8.2;
    const ENEMY_CV_MATCH_MIN = 0.82;
    const ENEMY_CV_MATCH_MAX = 1.18;
    const ENEMY_HP_CV_SHARE_MIN = 0.48;
    const ENEMY_HP_CV_SHARE_MAX = 0.68;
    const KILL_INCOME_RATIO = 0.45;
    const CLEAR_INCOME_RATIO = 0.55;
    const WAVE_INCOME_BASE = 9;
    const WAVE_INCOME_LINEAR = 2.4;
    const WAVE_INCOME_POWER = 1.15;
    const WAVE_INCOME_POWER_SCALE = 1.15;
    const CORE_GUARD_POINTS = [
        { x: 4.5, y: 3.7 },
        { x: 5.5, y: 3.7 },
        { x: 6.3, y: 4.5 },
        { x: 6.3, y: 5.5 },
        { x: 5.5, y: 6.3 },
        { x: 4.5, y: 6.3 },
        { x: 3.7, y: 5.5 },
        { x: 3.7, y: 4.5 }
    ];

    const UnitDefs = {
        melee: {
            label: "近战守卫",
            short: "M",
            color: "#60a5fa",
            cost: 10,
            hp: 30,
            hpLevel: 6,
            attack: 4,
            attackLevel: 1,
            range: 0.55,
            speed: 1.35,
            cooldown: 0.75
        },
        ranged: {
            label: "远程射手",
            short: "R",
            color: "#a78bfa",
            cost: 12,
            hp: 20,
            hpLevel: 4,
            attack: 5,
            attackLevel: 1,
            range: 2.7,
            speed: 0.95,
            cooldown: 1.05
        },
        repair: {
            label: "修复师",
            short: "H",
            color: "#34d399",
            cost: 10,
            hp: 22,
            hpLevel: 4,
            attack: 1,
            attackLevel: 1,
            range: 2.2,
            speed: 0.9,
            cooldown: 1.35,
            heal: 5,
            healLevel: 2
        }
    };

    const EnemyDef = {
        color: "#fb7185",
        hp: 5,
        attack: 1,
        range: 0.48,
        speed: 0.88,
        cooldown: 0.8,
        damageTakenScale: 1
    };

    const ShapeTemplates = [
        { name: "单格", color: "#60a5fa", cells: [[0, 0]] },
        { name: "双连", color: "#38bdf8", cells: [[0, 0], [0, 1]] },
        { name: "三连", color: "#a78bfa", cells: [[0, 0], [0, 1], [0, 2]] },
        { name: "短竖", color: "#f59e0b", cells: [[0, 0], [1, 0]] },
        { name: "方块", color: "#34d399", cells: [[0, 0], [0, 1], [1, 0], [1, 1]] },
        { name: "L 形", color: "#fb7185", cells: [[0, 0], [1, 0], [1, 1]] },
        { name: "T 形", color: "#f472b6", cells: [[0, 0], [0, 1], [0, 2], [1, 1]] },
        { name: "折线", color: "#22c55e", cells: [[0, 1], [0, 2], [1, 0], [1, 1]] }
    ];

    const dom = {
        canvas: document.getElementById("gameCanvas"),
        toastLayer: document.getElementById("toastLayer"),
        confirmOverlay: document.getElementById("confirmOverlay"),
        confirmTitle: document.getElementById("confirmTitle"),
        confirmMessage: document.getElementById("confirmMessage"),
        confirmCancelButton: document.getElementById("confirmCancelButton"),
        confirmOkButton: document.getElementById("confirmOkButton"),
        startGameButton: document.getElementById("startGameButton"),
        startBattleButton: document.getElementById("startBattleButton"),
        rotateButton: document.getElementById("rotateButton"),
        refreshShapesButton: document.getElementById("refreshShapesButton"),
        phaseText: document.getElementById("phaseText"),
        roundText: document.getElementById("roundText"),
        goldStat: document.getElementById("goldStat"),
        goldText: document.getElementById("goldText"),
        interestText: document.getElementById("interestText"),
        coreText: document.getElementById("coreText"),
        coreMeter: document.getElementById("coreMeter"),
        shapeList: document.getElementById("shapeList"),
        selectedCellText: document.getElementById("selectedCellText"),
        cellInfo: document.getElementById("cellInfo"),
        unitButtons: Array.from(document.querySelectorAll(".unit-button")),
        actorText: document.getElementById("actorText"),
        killText: document.getElementById("killText"),
        logList: document.getElementById("logList")
    };

    const ctx = dom.canvas.getContext("2d");
    const render = {
        width: 900,
        height: 720,
        dpr: 1,
        board: { x: 0, y: 0, size: 0, cell: 0 },
        hoverCell: null,
        messages: []
    };

    const state = {
        phase: "idle",
        round: 1,
        gold: INITIAL_GOLD,
        coreHp: MAX_CORE_HP,
        maxCoreHp: MAX_CORE_HP,
        cells: [],
        rowLevels: Array(GRID_SIZE).fill(1),
        colLevels: Array(GRID_SIZE).fill(1),
        freeBattleGridCredits: FREE_BATTLE_GRID_CREDITS,
        buildActions: 0,
        shapes: [],
        selectedShapeIndex: null,
        selectedUnitType: null,
        selectedCell: null,
        actors: [],
        battleStats: {
            kills: 0,
            enemiesToSpawn: 0,
            spawnedEnemies: 0,
            spawnTimer: 0,
            spawnInterval: MAX_ENEMY_SPAWN_INTERVAL,
            enemyHp: 1,
            enemyAttack: 1,
            enemyRange: EnemyDef.range,
            enemySpeed: EnemyDef.speed,
            enemyCooldown: EnemyDef.cooldown,
            enemyDamageTakenScale: EnemyDef.damageTakenScale,
            estimatedPlayerDps: 0,
            currentDefenseCv: 0,
            targetMonsterCv: 0,
            actualMonsterCv: 0,
            theoreticalEconomy: INITIAL_GOLD,
            killGoldPerEnemy: 0,
            killGoldBank: 0,
            clearReward: 0,
            targetClearTime: 0,
            coreCooldown: 0,
            endDelay: 0
        },
        buildCheckpoint: null,
        goldGainFx: {
            amount: 0,
            time: 0
        },
        nextActorId: 1,
        uiDirty: true,
        lastTime: 0
    };

    let pendingConfirmAction = null;

    function createCell(row, col) {
        return {
            row,
            col,
            filled: false,
            blockColor: null,
            isCore: col >= CORE_MIN && col <= CORE_MAX && row >= CORE_MIN && row <= CORE_MAX,
            isBattleGrid: false,
            rowProgress: 0,
            colProgress: 0,
            summonUnitType: null,
            hasSummonedThisBattle: false,
            charge: 0,
            mastery: 0,
            burstReady: 0,
            stageFlash: 0,
            flash: 0
        };
    }

    function resetGame() {
        hideConfirm();
        clearLog();
        state.phase = "build";
        state.round = 1;
        state.gold = INITIAL_GOLD;
        state.coreHp = MAX_CORE_HP;
        state.maxCoreHp = MAX_CORE_HP;
        state.cells = [];
        state.rowLevels = Array(GRID_SIZE).fill(1);
        state.colLevels = Array(GRID_SIZE).fill(1);
        state.freeBattleGridCredits = FREE_BATTLE_GRID_CREDITS;
        state.buildActions = getBuildActionLimit();
        state.actors = [];
        state.selectedShapeIndex = null;
        state.selectedUnitType = null;
        state.selectedCell = null;
        state.nextActorId = 1;
        render.hoverCell = null;
        render.messages = [];
        state.buildCheckpoint = null;
        clearGoldGainFx();
        resetBattleStats();

        for (let row = 0; row < GRID_SIZE; row += 1) {
            for (let col = 0; col < GRID_SIZE; col += 1) {
                state.cells.push(createCell(row, col));
            }
        }

        state.shapes = createShapeSet();
        state.buildCheckpoint = createBuildCheckpoint();
        pushLog("游戏开始：构建阶段，初始金币 " + INITIAL_GOLD + "，指挥上限 " + getCommandLimit() + "，构建行动 " + state.buildActions + "。");
        markDirty();
    }

    function resetToIdle() {
        hideConfirm();
        clearLog();
        state.phase = "idle";
        state.round = 1;
        state.gold = INITIAL_GOLD;
        state.coreHp = MAX_CORE_HP;
        state.maxCoreHp = MAX_CORE_HP;
        state.cells = [];
        state.rowLevels = Array(GRID_SIZE).fill(1);
        state.colLevels = Array(GRID_SIZE).fill(1);
        state.freeBattleGridCredits = FREE_BATTLE_GRID_CREDITS;
        state.buildActions = 0;
        state.shapes = [];
        state.selectedShapeIndex = null;
        state.selectedUnitType = null;
        state.selectedCell = null;
        state.actors = [];
        state.nextActorId = 1;
        render.hoverCell = null;
        render.messages = [];
        state.buildCheckpoint = null;
        clearGoldGainFx();
        resetBattleStats();
        pushLog("点击“开始游戏”进入原型。");
        markDirty();
    }

    function resetBattleStats() {
        state.battleStats = {
            kills: 0,
            enemiesToSpawn: 0,
            spawnedEnemies: 0,
            spawnTimer: 0,
            spawnInterval: MAX_ENEMY_SPAWN_INTERVAL,
            enemyHp: 1,
            enemyAttack: 1,
            enemyRange: EnemyDef.range,
            enemySpeed: EnemyDef.speed,
            enemyCooldown: EnemyDef.cooldown,
            enemyDamageTakenScale: EnemyDef.damageTakenScale,
            estimatedPlayerDps: 0,
            currentDefenseCv: 0,
            targetMonsterCv: 0,
            actualMonsterCv: 0,
            theoreticalEconomy: INITIAL_GOLD,
            killGoldPerEnemy: 0,
            killGoldBank: 0,
            clearReward: 0,
            targetClearTime: 0,
            coreCooldown: 0,
            endDelay: 0
        };
    }

    function clearGoldGainFx() {
        state.goldGainFx.amount = 0;
        state.goldGainFx.time = 0;
        if (dom.goldStat) {
            dom.goldStat.classList.remove("is-gold-bonus");
            dom.goldStat.removeAttribute("data-interest-gain");
        }
    }

    function triggerGoldGainFx(amount, label) {
        if (amount <= 0) {
            clearGoldGainFx();
            return;
        }
        state.goldGainFx.amount = amount;
        state.goldGainFx.time = 0.95;
        if (dom.goldStat) {
            dom.goldStat.classList.remove("is-gold-bonus");
            void dom.goldStat.offsetWidth;
            dom.goldStat.dataset.interestGain = "+ " + amount + " " + (label || "金币");
            dom.goldStat.classList.add("is-gold-bonus");
        }
    }

    function createBuildCheckpoint() {
        return {
            round: state.round,
            gold: state.gold,
            coreHp: state.coreHp,
            maxCoreHp: state.maxCoreHp,
            nextActorId: state.nextActorId,
            rowLevels: state.rowLevels.slice(),
            colLevels: state.colLevels.slice(),
            freeBattleGridCredits: state.freeBattleGridCredits,
            buildActions: state.buildActions,
            shapes: state.shapes.map(function (shape) {
                return {
                    id: shape.id,
                    name: shape.name,
                    color: shape.color,
                    used: !!shape.used,
                    cells: shape.cells.map(function (cell) {
                        return { row: cell.row, col: cell.col };
                    })
                };
            }),
            cells: state.cells.map(function (cell) {
                return {
                    row: cell.row,
                    col: cell.col,
                    filled: cell.filled,
                    blockColor: cell.blockColor,
                    isCore: cell.isCore,
                    isBattleGrid: cell.isBattleGrid,
                    rowProgress: cell.rowProgress || 0,
                    colProgress: cell.colProgress || 0,
                    summonUnitType: cell.summonUnitType,
                    hasSummonedThisBattle: false,
                    charge: cell.charge || 0,
                    mastery: cell.mastery || 0,
                    burstReady: cell.burstReady || 0,
                    stageFlash: 0,
                    flash: 0
                };
            })
        };
    }

    function restoreBuildCheckpoint(snapshot) {
        if (!snapshot) return false;

        state.phase = "build";
        state.round = snapshot.round;
        state.gold = snapshot.gold;
        state.coreHp = snapshot.coreHp;
        state.maxCoreHp = snapshot.maxCoreHp;
        state.nextActorId = snapshot.nextActorId;
        state.rowLevels = snapshot.rowLevels ? snapshot.rowLevels.slice() : deriveRowLevelsFromCells(snapshot.cells);
        state.colLevels = snapshot.colLevels ? snapshot.colLevels.slice() : deriveColumnLevelsFromCells(snapshot.cells);
        state.freeBattleGridCredits = typeof snapshot.freeBattleGridCredits === "number" ? snapshot.freeBattleGridCredits : FREE_BATTLE_GRID_CREDITS;
        state.buildActions = typeof snapshot.buildActions === "number" ? snapshot.buildActions : getBuildActionLimit();
        state.shapes = snapshot.shapes.map(function (shape) {
            return {
                id: shape.id,
                name: shape.name,
                color: shape.color,
                used: !!shape.used,
                cells: shape.cells.map(function (cell) {
                    return { row: cell.row, col: cell.col };
                })
            };
        });
        state.cells = snapshot.cells.map(function (cell) {
            return {
                row: cell.row,
                col: cell.col,
                filled: cell.filled,
                blockColor: cell.blockColor || null,
                isCore: cell.isCore,
                isBattleGrid: cell.isBattleGrid,
                rowProgress: cell.rowProgress || 0,
                colProgress: cell.colProgress || 0,
                summonUnitType: cell.summonUnitType,
                hasSummonedThisBattle: false,
                charge: Math.min(MAX_CELL_CHARGE, cell.charge || 0),
                mastery: Math.min(MAX_CELL_MASTERY, cell.mastery || 0),
                burstReady: Math.min(MAX_BURST_READY, cell.burstReady || 0),
                stageFlash: 0,
                flash: 0
            };
        });
        state.selectedShapeIndex = null;
        state.selectedUnitType = null;
        state.selectedCell = null;
        state.actors = [];
        render.hoverCell = null;
        render.messages = [];
        resetBattleStats();
        markDirty();
        return true;
    }

    function deriveRowLevelsFromCells(cells) {
        const levels = Array(GRID_SIZE).fill(1);
        if (!cells) return levels;
        cells.forEach(function (cell) {
            if (typeof cell.tileLevel === "number") {
                levels[cell.row] = Math.max(levels[cell.row], cell.tileLevel);
            }
        });
        return levels;
    }

    function deriveColumnLevelsFromCells(cells) {
        const levels = Array(GRID_SIZE).fill(1);
        if (!cells) return levels;
        cells.forEach(function (cell) {
            if (typeof cell.tileLevel === "number") {
                levels[cell.col] = Math.max(levels[cell.col], cell.tileLevel);
            }
        });
        return levels;
    }

    function getCellLevel(cell) {
        return getRowLevel(cell.row) + getColumnLevel(cell.col) - 1;
    }

    function getCellStage(cell) {
        if (!cell || !cell.isBattleGrid) return 1;
        if ((cell.charge || 0) >= STAGE_THREE_CHARGE) return 3;
        if ((cell.charge || 0) >= STAGE_TWO_CHARGE) return 2;
        return 1;
    }

    function getStageLabel(stage) {
        if (stage >= 3) return "III";
        if (stage >= 2) return "II";
        return "I";
    }

    function getCommandLimit() {
        const growth = Math.floor(Math.max(0, state.round - 1) / COMMAND_LIMIT_ROUND_STEP);
        return Math.min(MAX_COMMAND_LIMIT, BASE_COMMAND_LIMIT + growth);
    }

    function getBuildActionLimit() {
        const growth = Math.floor(Math.max(0, state.round - 1) / BUILD_ACTION_ROUND_STEP);
        return Math.min(BUILD_ACTION_MAX, BUILD_ACTION_BASE + growth);
    }

    function spendBuildAction(label) {
        if (state.buildActions < BUILD_ACTION_COST) {
            notify("构建行动已用完，请开始战斗验证这一轮。", "warn");
            return false;
        }
        state.buildActions -= BUILD_ACTION_COST;
        if (label) pushLog(label + "，剩余构建行动 " + state.buildActions + "。");
        return true;
    }

    function clamp(value, min, max) {
        return Math.max(min, Math.min(max, value));
    }

    function getBattleGridCount() {
        return state.cells.reduce(function (count, cell) {
            return count + (cell.isBattleGrid && cell.summonUnitType ? 1 : 0);
        }, 0);
    }

    function getUnitBuildCost(unitType) {
        return UnitDefs[unitType] && UnitDefs[unitType].cost ? UnitDefs[unitType].cost : BATTLE_GRID_COST;
    }

    function getBattleGridCost(cell, unitType) {
        const targetUnitType = unitType || (cell && cell.summonUnitType);
        if (cell && cell.isBattleGrid && cell.summonUnitType) {
            return Math.max(CHANGE_UNIT_COST, Math.ceil(getUnitBuildCost(targetUnitType) * 0.35));
        }
        return state.freeBattleGridCredits > 0 ? 0 : getUnitBuildCost(targetUnitType);
    }

    function addCellCharge(cell, amount, reason) {
        if (!cell || !cell.isBattleGrid || cell.isCore || amount <= 0) return false;
        const beforeCharge = cell.charge || 0;
        const beforeMastery = cell.mastery || 0;
        const beforeStage = getCellStage(cell);
        const totalCharge = beforeCharge + amount;
        const nextCharge = Math.min(MAX_CELL_CHARGE, totalCharge);
        const overflow = Math.max(0, totalCharge - MAX_CELL_CHARGE);
        const nextMastery = Math.min(MAX_CELL_MASTERY, beforeMastery + overflow);
        if (nextCharge === beforeCharge && nextMastery === beforeMastery) return false;
        cell.charge = nextCharge;
        cell.mastery = nextMastery;
        cell.flash = 0.55;
        cell.stageFlash = 0.9;

        const afterStage = getCellStage(cell);
        const label = UnitDefs[cell.summonUnitType] ? UnitDefs[cell.summonUnitType].short : "T";
        const chargeGain = nextCharge - beforeCharge;
        const masteryGain = nextMastery - beforeMastery;
        if (chargeGain > 0) {
            addFloatingMessage("+" + chargeGain + " 能量", cell.col + 0.5, cell.row + 0.5, "#8bd4ff");
        }
        if (masteryGain > 0) {
            addFloatingMessage("精通+" + masteryGain, cell.col + 0.5, cell.row + 0.5, "#f6c95f");
        }
        if (afterStage > beforeStage) {
            addFloatingMessage(label + " " + getStageLabel(afterStage), cell.col + 0.5, cell.row + 0.1, "#f6c95f");
            pushLog("地块 [" + (cell.col + 1) + "," + (cell.row + 1) + "] " + (reason || "充能") + "，升到 " + getStageLabel(afterStage) + " 阶。");
        } else if (masteryGain > 0) {
            pushLog("地块 [" + (cell.col + 1) + "," + (cell.row + 1) + "] 充能溢出转为精通 +" + masteryGain + "。");
        }
        return true;
    }

    function addCellBurst(cell, amount) {
        if (!cell || !cell.isBattleGrid || cell.isCore || amount <= 0) return false;
        const before = cell.burstReady || 0;
        const next = Math.min(MAX_BURST_READY, before + amount);
        if (next === before) return false;
        cell.burstReady = next;
        cell.flash = 0.65;
        addFloatingMessage("开场技+" + (next - before), cell.col + 0.5, cell.row + 0.78, "#f6c95f");
        return true;
    }

    function applyPlacementCharge(placedCells) {
        const affected = new Map();
        placedCells.forEach(function (cell) {
            if (!cell) return;
            addPlacementChargeTarget(affected, cell.row, cell.col, 3);
            addPlacementChargeTarget(affected, cell.row - 1, cell.col, 1);
            addPlacementChargeTarget(affected, cell.row + 1, cell.col, 1);
            addPlacementChargeTarget(affected, cell.row, cell.col - 1, 1);
            addPlacementChargeTarget(affected, cell.row, cell.col + 1, 1);
        });

        let chargedCount = 0;
        affected.forEach(function (amount, key) {
            const parts = key.split(",");
            const cell = getCell(Number(parts[0]), Number(parts[1]));
            if (addCellCharge(cell, amount, "方块放置")) chargedCount += 1;
        });
        if (chargedCount > 0) {
            pushLog("方块放置为 " + chargedCount + " 个战斗格即时充能。");
        }
    }

    function addPlacementChargeTarget(targets, row, col, amount) {
        const cell = getCell(row, col);
        if (!cell || !cell.isBattleGrid || cell.isCore) return;
        const key = row + "," + col;
        targets.set(key, Math.max(targets.get(key) || 0, amount));
    }

    function applyLineClearCharge(fullRows, fullCols, clearCount) {
        let chargedCount = 0;
        let burstCount = 0;
        fullRows.forEach(function (row) {
            addBoardWave("row", row, "#68d391");
            for (let col = 0; col < GRID_SIZE; col += 1) {
                const cell = getCell(row, col);
                if (addCellCharge(cell, 4, "行消除")) chargedCount += 1;
                if (addCellBurst(cell, 1)) burstCount += 1;
            }
        });
        fullCols.forEach(function (col) {
            addBoardWave("col", col, "#60a5fa");
            for (let row = 0; row < GRID_SIZE; row += 1) {
                const cell = getCell(row, col);
                if (addCellCharge(cell, 4, "列消除")) chargedCount += 1;
                if (addCellBurst(cell, 1)) burstCount += 1;
            }
        });
        if (chargedCount > 0 || burstCount > 0) {
            pushLog("消除能量扫过战斗格：充能 " + chargedCount + " 次，开场技 +" + burstCount + "。");
        } else if (clearCount > 0) {
            pushLog("消除能量未命中战斗格，可先把关键行列配置成战斗格。");
        }
    }

    function getRowLevel(row) {
        return state.rowLevels[row] || 1;
    }

    function getColumnLevel(col) {
        return state.colLevels[col] || 1;
    }

    function createRandomShape() {
        const template = ShapeTemplates[Math.floor(Math.random() * ShapeTemplates.length)];
        const cells = template.cells.map(function (cell) {
            return { row: cell[0], col: cell[1] };
        });
        return {
            id: "shape-" + Math.random().toString(36).slice(2),
            name: template.name,
            cells,
            color: template.color,
            used: false
        };
    }

    function createShapeSet() {
        return [createRandomShape(), createRandomShape(), createRandomShape()];
    }

    function areAllShapesUsed() {
        return state.shapes.length > 0 && state.shapes.every(function (shape) {
            return shape.used;
        });
    }

    function getCell(row, col) {
        if (row < 0 || row >= GRID_SIZE || col < 0 || col >= GRID_SIZE) return null;
        return state.cells[row * GRID_SIZE + col];
    }

    function markDirty() {
        state.uiDirty = true;
    }

    function phaseLabel() {
        if (state.phase === "build") return "构建";
        if (state.phase === "battle") return "战斗";
        return "未开始";
    }

    function selectShape(index) {
        if (state.phase !== "build") return;
        const shape = state.shapes[index];
        if (!shape) return;
        if (shape.used) {
            notify("该方块已经放置，请刷新候选方块。", "warn");
            state.selectedShapeIndex = null;
            markDirty();
            return;
        }
        state.selectedShapeIndex = state.selectedShapeIndex === index ? null : index;
        if (state.selectedShapeIndex !== null) {
            state.selectedUnitType = null;
            state.selectedCell = null;
        }
        markDirty();
    }

    function rotateSelectedShape() {
        if (state.phase !== "build") {
            notify("构建阶段才能旋转方块。", "warn");
            return;
        }
        const shape = state.shapes[state.selectedShapeIndex];
        if (!shape) {
            notify("请先选择一个候选方块。", "warn");
            return;
        }
        if (shape.used) {
            notify("该方块已经放置，请刷新候选方块。", "warn");
            cancelSelectedShape();
            return;
        }
        const rotated = shape.cells.map(function (cell) {
            return { row: cell.col, col: -cell.row };
        });
        normalizeCells(rotated);
        shape.cells = rotated;
        markDirty();
    }

    function normalizeCells(cells) {
        let minRow = Infinity;
        let minCol = Infinity;
        cells.forEach(function (cell) {
            minRow = Math.min(minRow, cell.row);
            minCol = Math.min(minCol, cell.col);
        });
        cells.forEach(function (cell) {
            cell.row -= minRow;
            cell.col -= minCol;
        });
    }

    function canPlaceShape(shape, baseRow, baseCol) {
        if (!shape) return { ok: false, reason: "未选择方块。" };
        if (shape.used) return { ok: false, reason: "该方块已经放置，请刷新候选方块。" };

        for (const part of shape.cells) {
            const cell = getCell(baseRow + part.row, baseCol + part.col);
            if (!cell) return { ok: false, reason: "方块超出棋盘。" };
            if (cell.filled) return { ok: false, reason: "目标位置已有构建块。" };
        }
        return { ok: true, reason: "" };
    }

    function placeSelectedShape(baseRow, baseCol) {
        if (state.phase !== "build") return;
        const shapeIndex = state.selectedShapeIndex;
        const shape = state.shapes[shapeIndex];
        const check = canPlaceShape(shape, baseRow, baseCol);
        if (!check.ok) {
            notify(check.reason, "error");
            cancelSelectedShape();
            return;
        }
        if (!spendBuildAction("放置 " + shape.name)) {
            cancelSelectedShape();
            markDirty();
            return;
        }

        const placedCells = [];
        shape.cells.forEach(function (part) {
            const cell = getCell(baseRow + part.row, baseCol + part.col);
            cell.filled = true;
            cell.blockColor = shape.color;
            cell.flash = 0.3;
            placedCells.push(cell);
        });
        shape.used = true;
        pushLog("本次放置不消耗金币。");
        applyPlacementCharge(placedCells);
        state.selectedShapeIndex = null;
        resolveLines();
        if (areAllShapesUsed()) {
            notify("3 个方块已放完，可花 " + SHAPE_REFRESH_COST + " 金刷新。", "warn");
            pushLog("候选方块已用完：刷新下一组需要 " + SHAPE_REFRESH_COST + " 金币。");
        }
        markDirty();
    }

    function refreshShapes() {
        if (state.phase !== "build") {
            notify("构建阶段才能刷新方块。", "warn");
            return;
        }
        if (!areAllShapesUsed()) {
            notify("先放完当前 3 个候选方块，才能刷新。", "warn");
            return;
        }
        if (state.gold < SHAPE_REFRESH_COST) {
            notify("金币不足，刷新需要 " + SHAPE_REFRESH_COST + " 金币。", "error");
            return;
        }
        if (!spendBuildAction("刷新候选方块")) {
            markDirty();
            return;
        }
        state.gold -= SHAPE_REFRESH_COST;
        state.shapes = createShapeSet();
        state.selectedShapeIndex = null;
        state.selectedUnitType = null;
        pushLog("刷新候选方块，消耗 " + SHAPE_REFRESH_COST + " 金币。");
        markDirty();
    }

    function isOccupiedForLine(cell) {
        return cell.filled;
    }

    function resolveLines() {
        const fullRows = [];
        const fullCols = [];

        for (let row = 0; row < GRID_SIZE; row += 1) {
            let full = true;
            for (let col = 0; col < GRID_SIZE; col += 1) {
                if (!isOccupiedForLine(getCell(row, col))) {
                    full = false;
                    break;
                }
            }
            if (full) fullRows.push(row);
        }

        for (let col = 0; col < GRID_SIZE; col += 1) {
            let full = true;
            for (let row = 0; row < GRID_SIZE; row += 1) {
                if (!isOccupiedForLine(getCell(row, col))) {
                    full = false;
                    break;
                }
            }
            if (full) fullCols.push(col);
        }

        if (fullRows.length === 0 && fullCols.length === 0) return;

        const clearCount = fullRows.length + fullCols.length;
        applyLineClearCharge(fullRows, fullCols, clearCount);

        for (const row of fullRows) {
            addRowProgress(row);
            for (let col = 0; col < GRID_SIZE; col += 1) {
                const cell = getCell(row, col);
                cell.filled = false;
                cell.blockColor = null;
            }
        }

        for (const col of fullCols) {
            addColumnProgress(col);
            for (let row = 0; row < GRID_SIZE; row += 1) {
                const cell = getCell(row, col);
                cell.filled = false;
                cell.blockColor = null;
            }
        }

        pushLog("消除 " + clearCount + " 条行列：触发战斗格充能、开场技和行列经验，不获得金币。");
    }

    function addRowProgress(row) {
        for (let col = 0; col < GRID_SIZE; col += 1) {
            const cell = getCell(row, col);
            if (cell.rowProgress === 0) {
                cell.rowProgress = 1;
                cell.flash = 0.5;
                break;
            }
        }

        if (getRowProgress(row) >= LINE_EXP_TO_LEVEL) {
            for (let col = 0; col < GRID_SIZE; col += 1) {
                const cell = getCell(row, col);
                cell.rowProgress = 0;
                cell.flash = 0.65;
            }
            state.rowLevels[row] = getRowLevel(row) + 1;
            pushLog("第 " + (row + 1) + " 行累计 " + LINE_EXP_TO_LEVEL + " 经验，行等级升到 Lv." + getRowLevel(row) + "。");
        }
    }

    function addColumnProgress(col) {
        for (let row = GRID_SIZE - 1; row >= 0; row -= 1) {
            const cell = getCell(row, col);
            if (cell.colProgress === 0) {
                cell.colProgress = 1;
                cell.flash = 0.5;
                break;
            }
        }

        if (getColumnProgress(col) >= LINE_EXP_TO_LEVEL) {
            for (let row = 0; row < GRID_SIZE; row += 1) {
                const cell = getCell(row, col);
                cell.colProgress = 0;
                cell.flash = 0.65;
            }
            state.colLevels[col] = getColumnLevel(col) + 1;
            pushLog("第 " + (col + 1) + " 列累计 " + LINE_EXP_TO_LEVEL + " 经验，列等级升到 Lv." + getColumnLevel(col) + "。");
        }
    }

    function getRowProgress(row) {
        let progress = 0;
        for (let col = 0; col < GRID_SIZE; col += 1) {
            progress += getCell(row, col).rowProgress ? 1 : 0;
        }
        return progress;
    }

    function getColumnProgress(col) {
        let progress = 0;
        for (let row = 0; row < GRID_SIZE; row += 1) {
            progress += getCell(row, col).colProgress ? 1 : 0;
        }
        return progress;
    }

    function selectCell(row, col) {
        if (state.phase !== "build") return;
        state.selectedCell = getCell(row, col);
        markDirty();
    }

    function selectUnit(unitType) {
        if (state.phase !== "build") return;
        state.selectedUnitType = state.selectedUnitType === unitType ? null : unitType;
        if (state.selectedUnitType) {
            state.selectedShapeIndex = null;
        }
        markDirty();
    }

    function cancelSelectedShape() {
        state.selectedShapeIndex = null;
        markDirty();
    }

    function cancelSelectedUnit() {
        state.selectedUnitType = null;
        markDirty();
    }

    function configureCell(targetCell, unitType) {
        if (state.phase !== "build") return;
        state.selectedCell = targetCell;
        const cell = targetCell;
        if (!cell) {
            notify("请先选择目标地块。", "warn");
            cancelSelectedUnit();
            return;
        }
        if (!unitType) {
            notify("请先选择要配置的作战单位。", "warn");
            cancelSelectedUnit();
            return;
        }
        if (cell.isCore) {
            notify("核心区域不可配置战斗格。", "error");
            cancelSelectedUnit();
            markDirty();
            return;
        }
        if (cell.summonUnitType === unitType) {
            notify("该地块已经配置为" + UnitDefs[unitType].label + "。", "warn");
            cancelSelectedUnit();
            markDirty();
            return;
        }

        const addsNewUnit = !cell.summonUnitType;
        if (addsNewUnit && getBattleGridCount() >= getCommandLimit()) {
            notify("指挥上限已满：" + getBattleGridCount() + "/" + getCommandLimit() + "。先强化现有单位，后续轮次会提高上限。", "warn");
            cancelSelectedUnit();
            markDirty();
            return;
        }

        const cost = getBattleGridCost(cell, unitType);
        if (state.gold < cost) {
            notify("金币不足，配置需要 " + cost + " 金币。", "error");
            cancelSelectedUnit();
            markDirty();
            return;
        }

        if (cost > 0) {
            state.gold -= cost;
        } else if (addsNewUnit && state.freeBattleGridCredits > 0) {
            state.freeBattleGridCredits -= 1;
        }
        cell.isBattleGrid = true;
        cell.summonUnitType = unitType;
        cell.flash = 0.45;
        pushLog("地块 [" + (cell.col + 1) + "," + (cell.row + 1) + "] 配置为" + UnitDefs[unitType].label + "，" + (cost > 0 ? "消耗 " + cost + " 金币" : "无需金币") + "。");
        state.selectedUnitType = null;
        markDirty();
    }

    function startBattle() {
        if (state.phase !== "build") {
            notify("请先开始游戏并进入构建阶段。", "warn");
            return;
        }

        state.phase = "battle";
        state.selectedShapeIndex = null;
        state.selectedUnitType = null;
        state.selectedCell = null;
        state.actors = [];
        resetBattleStats();
        state.battleStats.coreCooldown = 0.25;

        state.cells.forEach(function (cell) {
            cell.hasSummonedThisBattle = false;
            if (cell.isBattleGrid && cell.summonUnitType) {
                const actor = spawnHeroFromCell(cell);
                cell.hasSummonedThisBattle = true;
            }
        });

        setupDynamicWave();

        const openingEnemies = Math.min(6, state.battleStats.enemiesToSpawn);
        for (let index = 0; index < openingEnemies; index += 1) {
            spawnEnemy();
        }
        state.battleStats.spawnTimer = state.battleStats.spawnInterval;

        state.actors.forEach(function (actor) {
            if (actor.team === "player" && actor.sourceCell) {
                triggerOpeningSkill(actor, actor.sourceCell);
            }
        });

        pushLog("第 " + state.round + " 轮战斗开始：敌人 " + state.battleStats.enemiesToSpawn + " 个，HP " + state.battleStats.enemyHp + "，攻 " + state.battleStats.enemyAttack + "，间隔 " + state.battleStats.enemyCooldown.toFixed(2) + "，射程 " + state.battleStats.enemyRange.toFixed(2) + "，移速 " + state.battleStats.enemySpeed.toFixed(2) + "，承伤 " + state.battleStats.enemyDamageTakenScale.toFixed(2) + "，DCV " + Math.round(state.battleStats.currentDefenseCv) + " / MCV " + Math.round(state.battleStats.actualMonsterCv) + "。");
        markDirty();
    }

    function setupDynamicWave() {
        const theoreticalEconomy = getTheoreticalEconomyForRound(state.round);
        const currentDefenseCv = estimateCurrentDefenseCombatValue();
        const defenseProfile = getCurrentDefenseProfile();
        const recommendedMonsterCv = getRecommendedMonsterCombatValue(state.round, theoreticalEconomy);
        const difficultyMultiplier = getWaveDifficultyMultiplier(state.round);
        const lowerCv = currentDefenseCv * 0.68;
        const upperCv = currentDefenseCv * (difficultyMultiplier >= 1.15 ? 1.16 : difficultyMultiplier >= 1.05 ? 1.1 : 1.04);
        const targetMonsterCv = clamp(recommendedMonsterCv, lowerCv, upperCv);
        const targetClearTime = getTargetClearTime(state.round);
        const enemyCount = getEnemyCountForWave(state.round, targetMonsterCv, defenseProfile);
        const enemyStats = createEnemyStatsForWave(state.round, targetMonsterCv, enemyCount, defenseProfile);
        tuneEnemyStatsForTargetCv(enemyStats, targetMonsterCv, enemyCount, defenseProfile);
        const actualSingleEnemyCv = calculateEnemyCombatValue(enemyStats);
        const actualMonsterCv = actualSingleEnemyCv * enemyCount * getCountShapeFactor(enemyCount);
        const spawnInterval = clamp(targetClearTime * 0.65 / Math.max(1, enemyCount), MIN_ENEMY_SPAWN_INTERVAL, MAX_ENEMY_SPAWN_INTERVAL);
        const plannedIncome = getPlannedWaveIncome(state.round);
        const killGoldPool = plannedIncome * KILL_INCOME_RATIO;

        state.battleStats.estimatedPlayerDps = estimateCurrentPlayerDps();
        state.battleStats.currentDefenseCv = currentDefenseCv;
        state.battleStats.targetMonsterCv = targetMonsterCv;
        state.battleStats.actualMonsterCv = actualMonsterCv;
        state.battleStats.theoreticalEconomy = theoreticalEconomy;
        state.battleStats.targetClearTime = targetClearTime;
        state.battleStats.enemiesToSpawn = enemyCount;
        state.battleStats.enemyHp = enemyStats.hp;
        state.battleStats.enemyAttack = enemyStats.attack;
        state.battleStats.enemyRange = enemyStats.range;
        state.battleStats.enemySpeed = enemyStats.speed;
        state.battleStats.enemyCooldown = enemyStats.cooldownMax;
        state.battleStats.enemyDamageTakenScale = enemyStats.damageTakenScale;
        state.battleStats.killGoldPerEnemy = killGoldPool / Math.max(1, enemyCount);
        state.battleStats.killGoldBank = 0;
        state.battleStats.clearReward = Math.max(3, Math.round(plannedIncome * CLEAR_INCOME_RATIO));
        state.battleStats.spawnInterval = spawnInterval;
    }

    function spawnHeroFromCell(cell) {
        const def = UnitDefs[cell.summonUnitType];
        const level = getCellLevel(cell);
        const stage = getCellStage(cell);
        const levelBonus = level - 1;
        const charge = cell.charge || 0;
        const mastery = cell.mastery || 0;
        const power = charge + mastery * 1.8;
        let hp = def.hp + def.hpLevel * levelBonus;
        let attack = def.attack + def.attackLevel * levelBonus;
        let range = def.range;
        let speed = def.speed;
        let cooldownMax = def.cooldown;
        let shotsPerAttack = 1;
        let damageTakenScale = 1;
        let cleaveRadius = 0;
        let cleaveDamageScale = 0;
        let deathBurstRadius = 0;
        let deathBurstDamage = 0;
        let healMultiplier = 1;
        let supportPulseDamage = 0;
        let radius = 0.18;
        let barrageCooldownMax = 0;
        let barrageShots = 0;
        let barrageDamage = 0;

        if (cell.summonUnitType === "melee") {
            hp += stage >= 3 ? 120 : stage >= 2 ? 55 : 0;
            hp += Math.floor(power * 10);
            attack += stage >= 3 ? 14 : stage >= 2 ? 6 : 0;
            attack += Math.floor(power * 1.7);
            range += stage >= 3 ? 0.28 : stage >= 2 ? 0.12 : 0;
            range += Math.min(0.55, power * 0.012);
            cooldownMax = stage >= 3 ? 0.48 : stage >= 2 ? 0.58 : cooldownMax;
            cooldownMax = Math.max(0.24, cooldownMax - power * 0.012);
            damageTakenScale = stage >= 3 ? 0.32 : stage >= 2 ? 0.52 : 1;
            damageTakenScale = Math.max(0.18, damageTakenScale - power * 0.008);
            cleaveRadius = stage >= 3 ? 1.55 : stage >= 2 ? 1.05 : 0;
            cleaveRadius += Math.min(0.75, power * 0.015);
            cleaveDamageScale = stage >= 3 ? 1.05 : stage >= 2 ? 0.55 : 0;
            deathBurstRadius = stage >= 3 ? 1.6 : 0;
            deathBurstDamage = stage >= 3 ? attack * (4 + Math.floor(mastery / 8)) : 0;
            radius = stage >= 3 ? 0.25 : stage >= 2 ? 0.22 : radius;
        } else if (cell.summonUnitType === "ranged") {
            hp += stage >= 3 ? 34 : stage >= 2 ? 16 : 0;
            hp += Math.floor(power * 4.5);
            attack += stage >= 3 ? 12 : stage >= 2 ? 5 : 0;
            attack += Math.floor(power * 1.35);
            range += stage >= 3 ? 0.9 : stage >= 2 ? 0.42 : 0;
            range += Math.min(1.8, power * 0.04);
            cooldownMax = stage >= 3 ? 0.52 : stage >= 2 ? 0.72 : cooldownMax;
            cooldownMax = Math.max(0.22, cooldownMax - power * 0.01);
            shotsPerAttack = stage >= 3 ? 8 : stage >= 2 ? 4 : 1;
            shotsPerAttack += Math.floor(mastery / 6);
            barrageCooldownMax = stage >= 3 ? Math.max(1.6, 4.2 - mastery * 0.08) : 0;
            barrageShots = stage >= 3 ? 16 + Math.floor(power * 0.9) : 0;
            barrageDamage = stage >= 3 ? Math.max(1, Math.floor(attack * (0.75 + mastery * 0.018))) : 0;
            radius = stage >= 3 ? 0.23 : stage >= 2 ? 0.2 : radius;
        } else if (cell.summonUnitType === "repair") {
            hp += stage >= 3 ? 55 : stage >= 2 ? 24 : 0;
            hp += Math.floor(power * 6);
            attack += stage >= 3 ? 8 : stage >= 2 ? 3 : 0;
            attack += Math.floor(power * 0.85);
            range += stage >= 3 ? 0.55 : stage >= 2 ? 0.25 : 0;
            range += Math.min(1.1, power * 0.025);
            cooldownMax = stage >= 3 ? 0.72 : stage >= 2 ? 0.95 : cooldownMax;
            cooldownMax = Math.max(0.3, cooldownMax - power * 0.012);
            damageTakenScale = Math.max(0.55, 1 - power * 0.008);
            healMultiplier = (stage >= 3 ? 3.6 : stage >= 2 ? 2.1 : 1) + mastery * 0.08;
            supportPulseDamage = stage >= 3 ? 12 + Math.floor(power * 0.75) : stage >= 2 ? 5 + Math.floor(power * 0.35) : 0;
            radius = stage >= 3 ? 0.22 : stage >= 2 ? 0.2 : radius;
        }

        const guardPoint = getGuardPointForActor(state.nextActorId);
        const actor = {
            id: state.nextActorId,
            team: "player",
            kind: cell.summonUnitType,
            stage,
            charge,
            mastery,
            power,
            x: cell.col + 0.5,
            y: cell.row + 0.5,
            hp,
            maxHp: hp,
            attack,
            range,
            speed,
            cooldown: 0.2,
            cooldownMax,
            shotsPerAttack,
            damageTakenScale,
            cleaveRadius,
            cleaveDamageScale,
            deathBurstRadius,
            deathBurstDamage,
            healMultiplier,
            supportPulseDamage,
            barrageCooldown: barrageCooldownMax > 0 ? 0.8 : 0,
            barrageCooldownMax,
            barrageShots,
            barrageDamage,
            sourceCell: cell,
            guardX: guardPoint.x,
            guardY: guardPoint.y,
            radius,
            hitFlash: 0
        };
        state.nextActorId += 1;
        state.actors.push(actor);
        return actor;
    }

    function estimateCurrentPlayerDps() {
        const heroDps = state.actors.reduce(function (total, actor) {
            if (actor.team !== "player") return total;
            return total + estimateActorDps(actor);
        }, 0);
        return Math.max(8, heroDps + getCoreEstimatedDps(state.round));
    }

    function estimateCurrentDefenseCombatValue() {
        const heroCv = state.actors.reduce(function (total, actor) {
            if (actor.team !== "player") return total;
            return total + calculateDefenseCombatValue(actor);
        }, 0);
        return Math.max(25, heroCv + getCoreDefenseCombatValue(state.round));
    }

    function getCurrentDefenseProfile() {
        const players = state.actors.filter(function (actor) {
            return actor.team === "player";
        });
        const coreDps = getCoreEstimatedDps(state.round);
        const coreHit = 4 + state.round;
        if (players.length === 0) {
            return {
                averageHit: coreHit,
                averageSingleHit: coreHit,
                maxSingleHit: coreHit,
                averageCooldown: 0.58,
                averageRange: 2.2,
                averageSpeed: 1,
                aoePressure: 1,
                defensePressure: 1,
                totalDps: coreDps
            };
        }

        let hitTotal = coreHit;
        let singleHitTotal = coreHit;
        let maxSingleHit = coreHit;
        let cooldownTotal = 0.58;
        let rangeTotal = 7.2;
        let speedTotal = 0;
        let aoeTotal = 1;
        let defenseTotal = 1;
        let weightTotal = 1;
        let totalDps = coreDps;

        players.forEach(function (actor) {
            const actorDps = estimateActorDps(actor);
            const weight = Math.max(1, actorDps);
            const singleHit = getActorPrimaryHit(actor);
            hitTotal += getActorAverageHit(actor) * weight;
            singleHitTotal += singleHit * weight;
            maxSingleHit = Math.max(maxSingleHit, singleHit);
            cooldownTotal += Math.max(0.18, actor.cooldownMax || 1) * weight;
            rangeTotal += (actor.range || 0) * weight;
            speedTotal += (actor.speed || 0) * weight;
            aoeTotal += getActorAreaPressure(actor) * weight;
            defenseTotal += (1 / Math.max(0.18, actor.damageTakenScale || 1)) * weight;
            weightTotal += weight;
            totalDps += actorDps;
        });

        return {
            averageHit: hitTotal / weightTotal,
            averageSingleHit: singleHitTotal / weightTotal,
            maxSingleHit,
            averageCooldown: cooldownTotal / weightTotal,
            averageRange: rangeTotal / weightTotal,
            averageSpeed: speedTotal / weightTotal,
            aoePressure: aoeTotal / weightTotal,
            defensePressure: defenseTotal / weightTotal,
            totalDps
        };
    }

    function getActorPrimaryHit(actor) {
        if (actor.kind === "ranged") {
            return Math.max(actor.attack || 1, (actor.barrageDamage || 0) * 0.75);
        }
        if (actor.kind === "repair") {
            return Math.max(actor.attack || 1, (actor.supportPulseDamage || 0) * 0.55);
        }
        return actor.attack || 1;
    }

    function getActorTargetCoverage(actor) {
        if (actor.kind === "ranged") {
            const shotCount = Math.max(1, actor.shotsPerAttack || 1);
            const basicTargets = 1 + Math.min(shotCount - 1, 10) * (actor.stage >= 3 ? 0.85 : 0.7);
            const barrageTargets = actor.barrageCooldownMax > 0 ? Math.min(actor.barrageShots || 0, 28) * 0.18 : 0;
            return basicTargets + barrageTargets;
        }
        if (actor.kind === "melee") {
            return 1 + Math.min(3.2, (actor.cleaveRadius || 0) * (actor.cleaveDamageScale || 0) * 1.25);
        }
        if (actor.kind === "repair") {
            return 1 + Math.min(2.2, (actor.supportPulseDamage || 0) * 0.055);
        }
        return 1;
    }

    function getActorAverageHit(actor) {
        return getActorPrimaryHit(actor) * getActorTargetCoverage(actor);
    }

    function getActorAreaPressure(actor) {
        return getActorTargetCoverage(actor);
    }

    function calculateDefenseCombatValue(actor) {
        const dps = estimateActorDps(actor);
        const outputValue = DPS_CV_WEIGHT * dps * CV_REFERENCE_TIME * getRangeCoverageFactor(actor.range) * getMobilityCoverageFactor(actor);
        const ehp = actor.maxHp / Math.max(0.18, actor.damageTakenScale || 1);
        const defenseValue = DEFENSE_HP_CV_WEIGHT * ehp;
        const rangeValue = RANGE_CV_WEIGHT * actor.range * Math.max(1, actor.attack || 1);
        const mobilityValue = MOBILITY_CV_WEIGHT * actor.speed * CV_REFERENCE_TIME;
        const functionValue = getActorFunctionCombatValue(actor);
        const openingValue = getOpeningSkillCombatValue(actor);
        return outputValue + defenseValue + rangeValue + mobilityValue + functionValue + openingValue;
    }

    function estimateActorDps(actor) {
        const cooldown = Math.max(0.18, actor.cooldownMax || 1);
        if (actor.kind === "ranged") {
            const shotCount = Math.max(1, actor.shotsPerAttack || 1);
            const basicTargets = 1 + Math.min(shotCount - 1, 10) * (actor.stage >= 3 ? 0.85 : 0.7);
            const attackDps = (actor.attack / cooldown) * basicTargets;
            const barrageDps = actor.barrageCooldownMax > 0
                ? ((actor.barrageShots || 0) * (actor.barrageDamage || actor.attack) / actor.barrageCooldownMax) * 0.65
                : 0;
            return attackDps + barrageDps;
        }
        if (actor.kind === "melee") {
            return (actor.attack / cooldown) * (1 + (actor.cleaveDamageScale || 0) * 1.8);
        }
        if (actor.kind === "repair") {
            return (actor.attack / cooldown) * 0.6 + (actor.supportPulseDamage || 0) / cooldown;
        }
        return actor.attack / cooldown;
    }

    function getActorFunctionCombatValue(actor) {
        if (actor.kind === "repair") {
            const baseHeal = UnitDefs.repair.heal + UnitDefs.repair.healLevel * (getCellLevel(actor.sourceCell) - 1);
            return baseHeal * (actor.healMultiplier || 1) * 2.4;
        }
        if (actor.kind === "melee") {
            return actor.deathBurstDamage > 0 ? actor.deathBurstDamage * 0.22 : 0;
        }
        return 0;
    }

    function getOpeningSkillCombatValue(actor) {
        const burst = actor.sourceCell ? (actor.sourceCell.burstReady || 0) : 0;
        if (burst <= 0) return 0;
        if (actor.kind === "ranged") {
            const shots = Math.min(14, (actor.shotsPerAttack || 1) + burst * 3);
            return actor.attack * shots * (0.55 + burst * 0.08);
        }
        if (actor.kind === "melee") {
            return actor.attack * burst * (1.6 + actor.stage * 0.45);
        }
        if (actor.kind === "repair") {
            return (UnitDefs.repair.heal + actor.stage * 5) * burst * (actor.healMultiplier || 1) * 1.6;
        }
        return 0;
    }

    function getRangeCoverageFactor(range) {
        return clamp(0.82 + range * 0.22, 0.95, 2.35);
    }

    function getMobilityCoverageFactor(actor) {
        if (actor.kind === "ranged") return 1;
        return clamp(0.86 + (actor.speed || 0) * 0.16 + (actor.range || 0) * 0.06, 0.9, 1.32);
    }

    function getCoreEstimatedDps(round) {
        return ((4 + round) / 0.58) * 0.45;
    }

    function getCoreDefenseCombatValue(round) {
        return getCoreEstimatedDps(round) * CV_REFERENCE_TIME * 0.62 + state.maxCoreHp * DEFENSE_HP_CV_WEIGHT * 0.35;
    }

    function getTheoreticalEconomyForRound(round) {
        let economy = INITIAL_GOLD;
        for (let index = 1; index < round; index += 1) {
            economy += getPlannedWaveIncome(index);
        }
        return economy;
    }

    function getPlannedWaveIncome(round) {
        return Math.round(WAVE_INCOME_BASE + round * WAVE_INCOME_LINEAR + Math.pow(round, WAVE_INCOME_POWER) * WAVE_INCOME_POWER_SCALE);
    }

    function getDefenseInvestmentRatio(round) {
        return clamp(0.92 - (round - 1) * 0.012, 0.74, 0.92);
    }

    function getWaveDifficultyMultiplier(round) {
        if (round > 0 && round % 5 === 0) return 1.18;
        if (round > 0 && round % 3 === 0) return 1.08;
        return 0.96;
    }

    function getRecommendedMonsterCombatValue(round, theoreticalEconomy) {
        const targetDefenseCv = theoreticalEconomy * getDefenseInvestmentRatio(round) * CV_PER_GOLD;
        return (targetDefenseCv * getWaveDifficultyMultiplier(round)) / STABLE_COEFFICIENT;
    }

    function getEnemyCountForWave(round, targetMonsterCv, profile) {
        const targetHits = getEnemyTargetHits(round, profile);
        const baselineEhp = Math.max(8, profile.averageSingleHit * targetHits);
        const baselineHpValue = ENEMY_HP_CV_WEIGHT * baselineEhp;
        const baselineAttack = getEnemyBaseAttackForRound(round, profile);
        const baselineCooldown = getEnemyCooldownForRound(round, profile);
        const baselineDpsValue = DPS_CV_WEIGHT * (baselineAttack / baselineCooldown) * CV_REFERENCE_TIME;
        const baselineUtility = MOBILITY_CV_WEIGHT * getEnemySpeedForRound(round, profile) * CV_REFERENCE_TIME;
        const desiredSingleCv = Math.max(10, baselineHpValue + baselineDpsValue + baselineUtility);
        const aoeCountBonus = clamp(1 + (profile.aoePressure - 1) * 0.18, 0.95, 1.62);
        const rawCount = Math.round((targetMonsterCv / desiredSingleCv) * aoeCountBonus);
        const minCount = Math.round(7 + round * 1.8);
        const maxCount = Math.round(16 + round * 4.8 + Math.max(0, profile.aoePressure - 1) * 4);
        return clamp(rawCount, minCount, maxCount);
    }

    function createEnemyStatsForWave(round, targetMonsterCv, enemyCount, profile) {
        profile = profile || getCurrentDefenseProfile();
        const countShape = getCountShapeFactor(enemyCount);
        const targetSingleCv = targetMonsterCv / Math.max(1, enemyCount * countShape);
        const damageTakenScale = getEnemyDamageTakenScaleForRound(round, profile);
        const range = getEnemyRangeForRound(round, profile);
        const speed = getEnemySpeedForRound(round, profile);
        const cooldownMax = getEnemyCooldownForRound(round, profile);
        const targetHits = getEnemyTargetHits(round, profile);
        const hpShare = clamp(0.52 + Math.max(0, profile.aoePressure - 1) * 0.035 + round * 0.003, ENEMY_HP_CV_SHARE_MIN, ENEMY_HP_CV_SHARE_MAX);
        const hitBasedEhp = Math.max(profile.averageSingleHit, profile.maxSingleHit * 0.76) * targetHits;
        const budgetBasedEhp = (targetSingleCv * hpShare) / ENEMY_HP_CV_WEIGHT;
        const minEhp = getEnemyMinEhpForProfile(profile);
        const maxEhp = getEnemyMaxEhpForProfile(round, profile);
        const targetEhp = clamp(Math.max(hitBasedEhp, budgetBasedEhp), minEhp, maxEhp);
        const hp = Math.max(1, Math.round(targetEhp * damageTakenScale));
        const attack = getEnemyAttackFromCvBudget(round, targetSingleCv, hp, range, speed, cooldownMax, damageTakenScale, profile);

        return {
            hp,
            attack,
            range,
            speed,
            cooldownMax,
            damageTakenScale
        };
    }

    function tuneEnemyStatsForTargetCv(enemyStats, targetMonsterCv, enemyCount, profile) {
        const countShape = getCountShapeFactor(enemyCount);
        const targetSingleCv = targetMonsterCv / Math.max(1, enemyCount * countShape);
        const beforeCv = calculateEnemyCombatValue(enemyStats) * enemyCount * countShape;
        if (beforeCv >= targetMonsterCv * ENEMY_CV_MATCH_MIN && beforeCv <= targetMonsterCv * ENEMY_CV_MATCH_MAX) return;

        const targetSingleBeforeMultiplier = targetSingleCv / getEnemyAttributeMultiplier(enemyStats);
        const nonHpCv = calculateEnemyNonHpCombatValue(enemyStats);
        const desiredEhp = Math.max(1, (targetSingleBeforeMultiplier - nonHpCv) / ENEMY_HP_CV_WEIGHT);
        const minHp = Math.round(getEnemyMinEhpForProfile(profile) * enemyStats.damageTakenScale);
        const maxHp = Math.round(getEnemyMaxEhpForProfile(state.round, profile) * enemyStats.damageTakenScale);
        enemyStats.hp = clamp(Math.round(desiredEhp * enemyStats.damageTakenScale), minHp, Math.max(minHp, maxHp));
        enemyStats.attack = getEnemyAttackFromCvBudget(state.round, targetSingleCv, enemyStats.hp, enemyStats.range, enemyStats.speed, enemyStats.cooldownMax, enemyStats.damageTakenScale, profile);
    }

    function calculateEnemyCombatValue(enemyStats) {
        const eHp = enemyStats.hp / Math.max(0.18, enemyStats.damageTakenScale || 1);
        const baseValue = ENEMY_HP_CV_WEIGHT * eHp + calculateEnemyNonHpCombatValue(enemyStats);
        return baseValue * getEnemyAttributeMultiplier(enemyStats);
    }

    function calculateEnemyNonHpCombatValue(enemyStats) {
        const dps = enemyStats.attack / Math.max(0.2, enemyStats.cooldownMax || EnemyDef.cooldown);
        const dpsValue = DPS_CV_WEIGHT * dps * CV_REFERENCE_TIME;
        const rangeValue = RANGE_CV_WEIGHT * (enemyStats.range || EnemyDef.range) * Math.max(1, enemyStats.attack || 1);
        const mobilityValue = MOBILITY_CV_WEIGHT * (enemyStats.speed || EnemyDef.speed) * CV_REFERENCE_TIME;
        return dpsValue + rangeValue + mobilityValue;
    }

    function getEnemyAttributeMultiplier(enemyStats) {
        return getEnemySpeedFactor(enemyStats.speed) * getEnemyRangeThreatFactor(enemyStats.range) * getEnemyAttackSpeedFactor(enemyStats.cooldownMax);
    }

    function getEnemySpeedFactor(speed) {
        return clamp(1 + (speed - EnemyDef.speed) * 0.35, 0.88, 1.24);
    }

    function getEnemyRangeThreatFactor(range) {
        return clamp(1 + ((range || EnemyDef.range) - EnemyDef.range) * 0.18, 0.92, 1.18);
    }

    function getEnemyAttackSpeedFactor(cooldownMax) {
        return clamp(1 + ((EnemyDef.cooldown / Math.max(0.2, cooldownMax || EnemyDef.cooldown)) - 1) * 0.16, 0.9, 1.18);
    }

    function getEnemyTargetHits(round, profile) {
        const burstGap = Math.max(0, (profile.maxSingleHit || 1) - (profile.averageSingleHit || 1));
        const burstPressure = clamp(burstGap / Math.max(1, profile.averageSingleHit || 1), 0, 1.4);
        const aoePressure = Math.max(0, (profile.aoePressure || 1) - 1);
        return clamp(ENEMY_MIN_HITS_TO_KILL + round * 0.12 + aoePressure * 0.42 + burstPressure * 0.55, ENEMY_MIN_HITS_TO_KILL, ENEMY_MAX_HITS_TO_KILL + round * 0.1);
    }

    function getEnemyMinEhpForProfile(profile) {
        const singleHit = Math.max(1, profile.averageSingleHit || 1);
        const maxHit = Math.max(singleHit, profile.maxSingleHit || singleHit);
        return Math.max(8, singleHit * ENEMY_MIN_HITS_TO_KILL, maxHit * 1.45);
    }

    function getEnemyMaxEhpForProfile(round, profile) {
        const singleHit = Math.max(1, profile.averageSingleHit || 1);
        const maxHit = Math.max(singleHit, profile.maxSingleHit || singleHit);
        const aoeBonus = Math.max(0, (profile.aoePressure || 1) - 1) * 0.85;
        return Math.max(getEnemyMinEhpForProfile(profile), maxHit * (ENEMY_MAX_HITS_TO_KILL + round * 0.16 + aoeBonus));
    }

    function getEnemyAttackFromCvBudget(round, targetSingleCv, hp, range, speed, cooldownMax, damageTakenScale, profile) {
        const statsForModifier = {
            hp,
            attack: 1,
            range,
            speed,
            cooldownMax,
            damageTakenScale
        };
        const targetBeforeMultiplier = targetSingleCv / getEnemyAttributeMultiplier(statsForModifier);
        const eHp = hp / Math.max(0.18, damageTakenScale || 1);
        const hpValue = ENEMY_HP_CV_WEIGHT * eHp;
        const mobilityValue = MOBILITY_CV_WEIGHT * speed * CV_REFERENCE_TIME;
        const remainingValue = Math.max(targetSingleCv * 0.18, targetBeforeMultiplier - hpValue - mobilityValue);
        const attackCvPerPoint = (DPS_CV_WEIGHT * CV_REFERENCE_TIME / Math.max(0.2, cooldownMax)) + RANGE_CV_WEIGHT * range;
        const budgetAttack = remainingValue / Math.max(0.1, attackCvPerPoint);
        const baseAttack = getEnemyBaseAttackForRound(round, profile);
        const defensePressure = profile ? profile.defensePressure : 1;
        const maxAttack = Math.max(baseAttack + 1, 2 + round * 0.95 + Math.max(0, defensePressure - 1) * 2.2);
        return Math.max(baseAttack, Math.round(clamp(Math.max(baseAttack, budgetAttack), baseAttack, maxAttack)));
    }

    function getCountShapeFactor(count) {
        return clamp(0.88 + Math.log(Math.max(1, count)) / 13, 0.92, 1.22);
    }

    function getTargetClearTime(round) {
        return clamp(8 + round * 0.7, 8, 18);
    }

    function spawnEnemy() {
        const side = Math.floor(Math.random() * 4);
        let x = 0;
        let y = 0;
        if (side === 0) {
            x = Math.random() * GRID_SIZE;
            y = -0.6;
        } else if (side === 1) {
            x = GRID_SIZE + 0.6;
            y = Math.random() * GRID_SIZE;
        } else if (side === 2) {
            x = Math.random() * GRID_SIZE;
            y = GRID_SIZE + 0.6;
        } else {
            x = -0.6;
            y = Math.random() * GRID_SIZE;
        }

        const hp = state.battleStats.enemyHp || getEnemyHpForRound(state.round);
        state.actors.push({
            id: state.nextActorId,
            team: "enemy",
            kind: "enemy",
            x,
            y,
            hp,
            maxHp: hp,
            attack: state.battleStats.enemyAttack || getEnemyAttackForRound(state.round),
            range: state.battleStats.enemyRange || EnemyDef.range,
            speed: state.battleStats.enemySpeed || getEnemySpeedForRound(state.round),
            cooldown: 0.3,
            cooldownMax: state.battleStats.enemyCooldown || EnemyDef.cooldown,
            damageTakenScale: state.battleStats.enemyDamageTakenScale || EnemyDef.damageTakenScale,
            sourceCell: null,
            radius: 0.18,
            hitFlash: 0
        });
        state.nextActorId += 1;
        state.battleStats.spawnedEnemies += 1;
    }

    function getEnemyHpForRound(round) {
        return Math.max(6, Math.round(7 + round * 2.2 + Math.pow(round, 1.18) * 0.8));
    }

    function getEnemyBaseAttackForRound(round, profile) {
        const defensePressure = profile ? profile.defensePressure : 1;
        return Math.max(1, Math.round(1 + round * 0.28 + Math.max(0, defensePressure - 1) * 0.35));
    }

    function getEnemyAttackForRound(round, profile) {
        return getEnemyBaseAttackForRound(round, profile);
    }

    function getEnemyRangeForRound(round, profile) {
        const playerRange = profile ? profile.averageRange : 2.2;
        return clamp(EnemyDef.range + round * 0.012 + Math.max(0, playerRange - 2.5) * 0.025, 0.42, 0.9);
    }

    function getEnemySpeedForRound(round, profile) {
        const ramp = Math.max(0, round - 1);
        const playerRange = profile ? profile.averageRange : 2.2;
        return clamp(EnemyDef.speed + Math.min(0.32, ramp * 0.018) + Math.max(0, playerRange - 3) * 0.018, 0.82, 1.28);
    }

    function getEnemyCooldownForRound(round, profile) {
        const playerCooldown = profile ? profile.averageCooldown : 0.8;
        return clamp(EnemyDef.cooldown - round * 0.006 - Math.max(0, 0.8 - playerCooldown) * 0.08, 0.52, 0.95);
    }

    function getEnemyDamageTakenScaleForRound(round, profile) {
        const averageSingleHit = profile ? profile.averageSingleHit : 8;
        const maxSingleHit = profile ? profile.maxSingleHit : averageSingleHit;
        const aoePressure = profile ? Math.max(0, profile.aoePressure - 1) : 0;
        const hitPressure = clamp((Math.max(averageSingleHit, maxSingleHit * 0.65) - 12) / 120 + aoePressure * 0.025, 0, 0.26);
        return clamp(EnemyDef.damageTakenScale - Math.floor((round - 1) / 4) * 0.032 - hitPressure, 0.58, 1);
    }

    function updateBattle(dt) {
        if (state.phase !== "battle") return;
        const stats = state.battleStats;
        stats.spawnTimer -= dt;
        if (stats.spawnedEnemies < stats.enemiesToSpawn && stats.spawnTimer <= 0) {
            spawnEnemy();
            stats.spawnTimer = stats.spawnInterval;
        }

        stats.coreCooldown -= dt;
        if (stats.coreCooldown <= 0) {
            coreCannonFire();
            stats.coreCooldown = 0.58;
        }

        for (const actor of state.actors) {
            actor.cooldown = Math.max(0, actor.cooldown - dt);
            actor.barrageCooldown = Math.max(0, (actor.barrageCooldown || 0) - dt);
            actor.hitFlash = Math.max(0, actor.hitFlash - dt);
            if (actor.team === "player") updateHero(actor, dt);
            if (state.phase !== "battle") return;
        }

        for (const actor of state.actors) {
            if (actor.team === "enemy") updateEnemy(actor, dt);
            if (state.phase !== "battle") return;
        }

        cleanupDeadActors();
        if (state.phase !== "battle") return;

        const enemyCount = countActors("enemy");
        if (stats.spawnedEnemies >= stats.enemiesToSpawn && enemyCount === 0) {
            stats.endDelay += dt;
            if (stats.endDelay > 0.55) endBattle();
        } else {
            stats.endDelay = 0;
        }
    }

    function updateHero(actor, dt) {
        if (actor.hp <= 0) return;

        if (actor.kind === "ranged" && actor.stage >= 3 && actor.barrageCooldownMax > 0 && actor.barrageCooldown <= 0) {
            fireRangedBarrage(actor);
            actor.barrageCooldown = actor.barrageCooldownMax;
        }

        if (actor.kind === "repair" && state.coreHp < state.maxCoreHp && actor.cooldown <= 0) {
            const def = UnitDefs.repair;
            const heal = (def.heal + def.healLevel * (getCellLevel(actor.sourceCell) - 1)) * (actor.healMultiplier || 1);
            healCore(heal);
            if (actor.stage >= 2) {
                healNearestAlly(actor, heal * 0.55, actor.stage >= 3 ? 2.2 : 1.35);
            }
            if (actor.supportPulseDamage > 0) {
                damageEnemiesAround(actor.x, actor.y, actor.stage >= 3 ? 2.2 : 1.35, actor.supportPulseDamage);
                addPulse(actor.x, actor.y, actor.stage >= 3 ? 2.2 : 1.35, "#34d399");
            }
            actor.cooldown = actor.cooldownMax;
            return;
        }

        const target = findNearestActor(actor.x, actor.y, "enemy", HERO_AGGRO_RANGE);
        if (!target) {
            moveBackToGuardPoint(actor, dt);
            return;
        }
        const dist = distance(actor, target);
        if (dist > actor.range) {
            moveToward(actor, target.x, target.y, actor.speed * dt);
            return;
        }
        if (actor.cooldown <= 0) {
            attackWithHero(actor, target);
            actor.cooldown = actor.cooldownMax;
        }
    }

    function attackWithHero(actor, target) {
        if (actor.kind === "ranged") {
            const targets = findNearestActors(actor.x, actor.y, "enemy", actor.range + 0.25, actor.shotsPerAttack || 1);
            targets.forEach(function (enemy, index) {
                const damageScale = index === 0 ? 1 : actor.stage >= 3 ? 0.85 : 0.7;
                const damage = Math.max(1, Math.floor(actor.attack * damageScale));
                const finalDamage = damageActor(enemy, damage);
                addProjectile(actor.x, actor.y, enemy.x, enemy.y, index === 0 ? "#93c5fd" : "#c4b5fd", "ranged");
                addFloatingMessage("-" + finalDamage, enemy.x, enemy.y, "#f8fafc");
            });
            return;
        }

        const finalDamage = damageActor(target, actor.attack);
        addFloatingMessage("-" + finalDamage, target.x, target.y, "#f8fafc");
        if (actor.kind === "melee" && actor.cleaveRadius > 0) {
            damageEnemiesAround(target.x, target.y, actor.cleaveRadius, Math.max(1, Math.floor(actor.attack * actor.cleaveDamageScale)), target);
            addPulse(target.x, target.y, actor.cleaveRadius, "#60a5fa");
        }
    }

    function fireRangedBarrage(actor) {
        const targets = findNearestActors(actor.x, actor.y, "enemy", 16, actor.barrageShots || 0);
        if (targets.length === 0) return;

        targets.forEach(function (enemy, index) {
            const damage = Math.max(1, Math.floor((actor.barrageDamage || actor.attack) * (index % 3 === 0 ? 1 : 0.78)));
            const finalDamage = damageActor(enemy, damage);
            addProjectile(actor.x, actor.y, enemy.x, enemy.y, index % 3 === 0 ? "#f6c95f" : "#c4b5fd", "ranged");
            addFloatingMessage("-" + finalDamage, enemy.x, enemy.y, index % 3 === 0 ? "#fef3c7" : "#f8fafc");
        });
        addPulse(actor.x, actor.y, 2.1 + Math.min(1.4, (actor.mastery || 0) * 0.05), "#a78bfa");
        addFloatingMessage("弹幕 x" + targets.length, actor.x, actor.y - 0.25, "#f6c95f");
    }

    function updateEnemy(actor, dt) {
        if (actor.hp <= 0) return;

        const heroTarget = findNearestActor(actor.x, actor.y, "player", 1.35);
        if (heroTarget) {
            const dist = distance(actor, heroTarget);
            if (dist > actor.range) {
                moveToward(actor, heroTarget.x, heroTarget.y, actor.speed * dt);
            } else if (actor.cooldown <= 0) {
                damageActor(heroTarget, actor.attack);
                actor.cooldown = actor.cooldownMax;
            }
            return;
        }

        const coreDist = distanceToPoint(actor.x, actor.y, CORE_CENTER.x, CORE_CENTER.y);
        if (coreDist > 1.05) {
            moveToward(actor, CORE_CENTER.x, CORE_CENTER.y, actor.speed * dt);
        } else if (actor.cooldown <= 0) {
            state.coreHp = Math.max(0, state.coreHp - actor.attack);
            actor.cooldown = actor.cooldownMax;
            addFloatingMessage("-" + actor.attack, CORE_CENTER.x, CORE_CENTER.y, "#f87171");
            if (state.coreHp <= 0) {
                rollbackBattle();
            }
        }
    }

    function rollbackBattle() {
        if (state.phase !== "battle") return;
        hideConfirm();
        if (restoreBuildCheckpoint(state.buildCheckpoint)) {
            notify("核心被摧毁，已回溯到本轮构建开始状态。请重新调整策略。", "error");
        } else {
            state.phase = "build";
            state.coreHp = Math.max(1, state.maxCoreHp);
            state.actors = [];
            resetBattleStats();
            notify("核心被摧毁，已返回构建阶段。", "error");
            markDirty();
        }
    }

    function coreCannonFire() {
        const target = findNearestActor(CORE_CENTER.x, CORE_CENTER.y, "enemy", 7.2);
        if (!target) return;
        const damage = 4 + state.round;
        damageActor(target, damage);
        addProjectile(CORE_CENTER.x, CORE_CENTER.y, target.x, target.y, "#facc15", "core");
    }

    function damageActor(actor, damage) {
        const scale = actor.damageTakenScale || 1;
        const finalDamage = Math.max(1, Math.ceil(damage * scale));
        actor.hp -= finalDamage;
        actor.hitFlash = 0.14;
        return finalDamage;
    }

    function cleanupDeadActors() {
        const before = state.actors.length;
        const explodedIds = new Set();

        state.actors.forEach(function (actor) {
            if (actor.hp > 0 || actor.team !== "player" || !(actor.deathBurstRadius > 0) || !(actor.deathBurstDamage > 0)) return;
            if (!explodedIds.has(actor.id)) {
                damageEnemiesAround(actor.x, actor.y, actor.deathBurstRadius, actor.deathBurstDamage);
                addPulse(actor.x, actor.y, actor.deathBurstRadius, "#60a5fa");
                addFloatingMessage("震爆", actor.x, actor.y - 0.2, "#dbeafe");
                explodedIds.add(actor.id);
            }
        });

        state.actors = state.actors.filter(function (actor) {
            if (actor.hp > 0) return true;
            if (actor.team === "enemy") {
                state.battleStats.kills += 1;
                state.battleStats.killGoldBank += state.battleStats.killGoldPerEnemy || 0;
                const reward = Math.floor(state.battleStats.killGoldBank + 0.0001);
                if (reward > 0) {
                    state.gold += reward;
                    state.battleStats.killGoldBank -= reward;
                    addFloatingMessage("+" + reward, actor.x, actor.y, "#f6c95f");
                }
            }
            return false;
        });
        if (before !== state.actors.length) markDirty();
    }

    function endBattle() {
        const reward = state.battleStats.clearReward || Math.max(3, Math.round(getPlannedWaveIncome(state.round) * CLEAR_INCOME_RATIO));
        state.gold += reward;
        state.coreHp = Math.min(state.maxCoreHp, state.coreHp + 8);
        state.round += 1;
        state.phase = "build";
        state.buildActions = getBuildActionLimit();
        state.actors = [];
        state.cells.forEach(function (cell) {
            cell.hasSummonedThisBattle = false;
        });
        state.buildCheckpoint = createBuildCheckpoint();
        triggerGoldGainFx(reward, "胜利");
        pushLog("战斗胜利：奖励 " + reward + " 金币，回到构建阶段，构建行动 " + state.buildActions + "。");
        markDirty();
    }

    function triggerOpeningSkill(actor, cell) {
        if (!actor || !cell || !cell.burstReady) return;
        const burstCount = cell.burstReady;
        cell.burstReady = 0;
        cell.flash = 0.8;
        addPulse(actor.x, actor.y, 1 + actor.stage * 0.35, UnitDefs[actor.kind].color);

        if (actor.kind === "melee") {
            const target = findNearestActor(actor.x, actor.y, "enemy", 16);
            const centerX = target ? target.x : CORE_CENTER.x;
            const centerY = target ? target.y : CORE_CENTER.y;
            const radius = 1.2 + actor.stage * 0.35 + burstCount * 0.12;
            const damage = Math.floor(actor.attack * (1.4 + actor.stage * 0.55) * burstCount);
            damageEnemiesAround(centerX, centerY, radius, damage);
            addPulse(centerX, centerY, radius, "#60a5fa");
            addFloatingMessage("盾击 x" + burstCount, actor.x, actor.y - 0.2, "#dbeafe");
        } else if (actor.kind === "ranged") {
            const shots = Math.min(14, (actor.shotsPerAttack || 1) + burstCount * 3);
            const targets = findNearestActors(actor.x, actor.y, "enemy", 16, shots);
            targets.forEach(function (enemy) {
                const damage = Math.floor(actor.attack * (1.15 + burstCount * 0.22));
                const finalDamage = damageActor(enemy, damage);
                addProjectile(actor.x, actor.y, enemy.x, enemy.y, "#c4b5fd", "ranged");
                addFloatingMessage("-" + finalDamage, enemy.x, enemy.y, "#f8fafc");
            });
            addFloatingMessage("齐射 x" + shots, actor.x, actor.y - 0.2, "#c4b5fd");
        } else if (actor.kind === "repair") {
            const heal = (UnitDefs.repair.heal + actor.stage * 5) * burstCount * (actor.healMultiplier || 1);
            healCore(heal);
            healNearestAlly(actor, heal * 0.6, actor.stage >= 3 ? 2.4 : 1.5);
            if (actor.supportPulseDamage > 0) {
                damageEnemiesAround(CORE_CENTER.x, CORE_CENTER.y, 1.5 + actor.stage * 0.42, actor.supportPulseDamage * burstCount * 2);
            }
            addPulse(CORE_CENTER.x, CORE_CENTER.y, 1.1 + actor.stage * 0.38, "#34d399");
            addFloatingMessage("开场修复", actor.x, actor.y - 0.2, "#bbf7d0");
        }
        pushLog(UnitDefs[actor.kind].label + " " + getStageLabel(actor.stage) + " 阶触发开场技 x" + burstCount + "。");
    }

    function healCore(amount) {
        const heal = Math.max(1, Math.round(amount));
        state.coreHp = Math.min(state.maxCoreHp, state.coreHp + heal);
        addFloatingMessage("+" + heal, CORE_CENTER.x, CORE_CENTER.y, "#68d391");
    }

    function healNearestAlly(actor, amount, range) {
        const allies = state.actors
            .filter(function (ally) {
                return ally.team === "player" && ally.id !== actor.id && ally.hp > 0 && ally.hp < ally.maxHp && distanceToPoint(actor.x, actor.y, ally.x, ally.y) <= range;
            })
            .sort(function (a, b) {
                return distanceToPoint(actor.x, actor.y, a.x, a.y) - distanceToPoint(actor.x, actor.y, b.x, b.y);
            })
            .slice(0, actor.stage >= 3 ? 4 : 1);
        allies.forEach(function (ally) {
            const heal = Math.max(1, Math.round(amount));
            ally.hp = Math.min(ally.maxHp, ally.hp + heal);
            addFloatingMessage("+" + heal, ally.x, ally.y, "#bbf7d0");
            addProjectile(actor.x, actor.y, ally.x, ally.y, "#34d399", "heal");
        });
    }

    function damageEnemiesAround(x, y, radius, damage, excludeActor) {
        let hitCount = 0;
        state.actors.forEach(function (enemy) {
            if (enemy.team !== "enemy" || enemy.hp <= 0 || enemy === excludeActor) return;
            if (distanceToPoint(x, y, enemy.x, enemy.y) > radius) return;
            const finalDamage = damageActor(enemy, damage);
            addFloatingMessage("-" + finalDamage, enemy.x, enemy.y, "#f8fafc");
            hitCount += 1;
        });
        return hitCount;
    }

    function findNearestActor(x, y, team, maxDistance) {
        let best = null;
        let bestDistance = typeof maxDistance === "number" ? maxDistance : Infinity;
        for (const actor of state.actors) {
            if (actor.team !== team || actor.hp <= 0) continue;
            const dist = distanceToPoint(x, y, actor.x, actor.y);
            if (dist < bestDistance) {
                bestDistance = dist;
                best = actor;
            }
        }
        return best;
    }

    function findNearestActors(x, y, team, maxDistance, limit) {
        const range = typeof maxDistance === "number" ? maxDistance : Infinity;
        return state.actors
            .filter(function (actor) {
                return actor.team === team && actor.hp > 0 && distanceToPoint(x, y, actor.x, actor.y) <= range;
            })
            .sort(function (a, b) {
                return distanceToPoint(x, y, a.x, a.y) - distanceToPoint(x, y, b.x, b.y);
            })
            .slice(0, limit || 1);
    }

    function countActors(team) {
        return state.actors.filter(function (actor) {
            return actor.team === team && actor.hp > 0;
        }).length;
    }

    function getGuardPointForActor(actorId) {
        return CORE_GUARD_POINTS[actorId % CORE_GUARD_POINTS.length];
    }

    function moveBackToGuardPoint(actor, dt) {
        const guardX = typeof actor.guardX === "number" ? actor.guardX : CORE_CENTER.x;
        const guardY = typeof actor.guardY === "number" ? actor.guardY : CORE_CENTER.y;
        if (distanceToPoint(actor.x, actor.y, guardX, guardY) > 0.12) {
            moveToward(actor, guardX, guardY, actor.speed * dt);
        }
    }

    function distance(a, b) {
        return distanceToPoint(a.x, a.y, b.x, b.y);
    }

    function distanceToPoint(x1, y1, x2, y2) {
        const dx = x2 - x1;
        const dy = y2 - y1;
        return Math.sqrt(dx * dx + dy * dy);
    }

    function moveToward(actor, x, y, amount) {
        const dist = distanceToPoint(actor.x, actor.y, x, y);
        if (dist <= 0.001) return;
        actor.x += ((x - actor.x) / dist) * amount;
        actor.y += ((y - actor.y) / dist) * amount;
    }

    function addProjectile(fromX, fromY, toX, toY, color, style) {
        render.messages.push({
            type: "line",
            fromX,
            fromY,
            toX,
            toY,
            color,
            style: style || "ranged",
            time: 0.16,
            maxTime: 0.16
        });
    }

    function addBoardWave(axis, index, color) {
        render.messages.push({
            type: "wave",
            axis,
            index,
            color,
            time: 0.42,
            maxTime: 0.42
        });
    }

    function addPulse(x, y, radius, color) {
        render.messages.push({
            type: "pulse",
            x,
            y,
            radius,
            color,
            time: 0.38,
            maxTime: 0.38
        });
    }

    function addFloatingMessage(text, x, y, color) {
        render.messages.push({
            type: "text",
            text,
            x,
            y,
            color,
            time: 0.8,
            maxTime: 0.8
        });
    }

    function pushLog(text) {
        const item = document.createElement("li");
        item.textContent = text;
        dom.logList.prepend(item);
        while (dom.logList.children.length > 12) {
            dom.logList.removeChild(dom.logList.lastElementChild);
        }
    }

    function notify(text, type) {
        pushLog(text);
        const toast = document.createElement("div");
        toast.className = "toast" + (type ? " is-" + type : "");
        toast.textContent = text;
        dom.toastLayer.appendChild(toast);
        window.setTimeout(function () {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 1900);
    }

    function showConfirm(title, message, onConfirm) {
        pendingConfirmAction = onConfirm;
        dom.confirmTitle.textContent = title;
        dom.confirmMessage.textContent = message;
        dom.confirmOverlay.hidden = false;
        dom.confirmCancelButton.focus();
    }

    function hideConfirm() {
        pendingConfirmAction = null;
        dom.confirmOverlay.hidden = true;
    }

    function confirmPendingAction() {
        const action = pendingConfirmAction;
        hideConfirm();
        if (typeof action === "function") action();
    }

    function clearLog() {
        dom.logList.innerHTML = "";
    }

    function handleCanvasClick(event) {
        const cellPos = eventToCell(event);
        if (!cellPos) return;
        if (state.phase !== "build") return;

        if (state.selectedShapeIndex !== null) {
            placeSelectedShape(cellPos.row, cellPos.col);
        } else if (state.selectedUnitType !== null) {
            configureCell(getCell(cellPos.row, cellPos.col), state.selectedUnitType);
        } else {
            selectCell(cellPos.row, cellPos.col);
        }
    }

    function handleCanvasPointerDown(event) {
        event.preventDefault();
        render.hoverCell = eventToCell(event);
        handleCanvasClick(event);
    }

    function handleCanvasMove(event) {
        render.hoverCell = eventToCell(event);
    }

    function eventToCell(event) {
        const rect = dom.canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        const board = render.board;
        if (x < board.x || y < board.y || x > board.x + board.size || y > board.y + board.size) {
            return null;
        }
        return {
            col: Math.floor((x - board.x) / board.cell),
            row: Math.floor((y - board.y) / board.cell)
        };
    }

    function updateUI() {
        if (state.phase === "idle") {
            dom.startGameButton.textContent = "开始游戏";
        } else {
            dom.startGameButton.textContent = "重置游戏";
        }
        dom.phaseText.textContent = phaseLabel();
        dom.roundText.textContent = String(state.round);
        dom.goldText.textContent = String(state.gold);
        dom.interestText.textContent = state.phase === "idle"
            ? "行动 0/" + BUILD_ACTION_BASE + " · 指挥 0/" + BASE_COMMAND_LIMIT
            : "行动 " + state.buildActions + "/" + getBuildActionLimit() + " · 指挥 " + getBattleGridCount() + "/" + getCommandLimit() + (state.freeBattleGridCredits > 0 ? " · 免费 " + state.freeBattleGridCredits : "");
        dom.coreText.textContent = Math.round(state.coreHp) + " / " + state.maxCoreHp;
        dom.coreMeter.style.width = Math.max(0, (state.coreHp / state.maxCoreHp) * 100) + "%";

        const playerCount = countActors("player");
        const enemyCount = countActors("enemy");
        dom.actorText.textContent = state.phase === "battle"
            ? "单位 " + playerCount + " / 敌人 " + enemyCount + " / DCV " + Math.round(state.battleStats.currentDefenseCv) + " / MCV " + Math.round(state.battleStats.actualMonsterCv)
            : "单位 " + playerCount + " / 指挥 " + getBattleGridCount() + "/" + getCommandLimit() + " / 敌人 " + enemyCount;
        dom.killText.textContent = String(state.battleStats.kills);

        dom.startBattleButton.disabled = state.phase !== "build";
        dom.rotateButton.disabled = state.phase !== "build" || state.selectedShapeIndex === null;
        dom.refreshShapesButton.textContent = "刷新方块 " + SHAPE_REFRESH_COST + "金";
        dom.refreshShapesButton.disabled = state.phase !== "build" || !areAllShapesUsed() || state.buildActions < BUILD_ACTION_COST;

        if (state.uiDirty) {
            renderShapeList();
            renderCellPanel();
            state.uiDirty = false;
        }
    }

    function renderShapeList() {
        dom.shapeList.innerHTML = "";
        state.shapes.forEach(function (shape, index) {
            const button = document.createElement("button");
            button.type = "button";
            button.className = "shape-card" + (state.selectedShapeIndex === index && !shape.used ? " is-selected" : "") + (shape.used ? " is-used" : "");
            button.disabled = state.phase !== "build" || shape.used;
            button.setAttribute("aria-label", shape.used ? "方块 " + shape.name + " 已放置" : "选择免费方块 " + shape.name);
            button.addEventListener("click", function () {
                selectShape(index);
            });

            const mini = document.createElement("div");
            mini.className = "shape-mini";
            mini.style.setProperty("--shape-color", shape.color);
            const bounds = getShapeBounds(shape.cells);
            mini.style.gridTemplateColumns = "repeat(" + bounds.cols + ", 13px)";
            mini.style.gridTemplateRows = "repeat(" + bounds.rows + ", 13px)";

            for (let row = 0; row < bounds.rows; row += 1) {
                for (let col = 0; col < bounds.cols; col += 1) {
                    const exists = shape.cells.some(function (cell) {
                        return cell.row === row && cell.col === col;
                    });
                    const part = document.createElement("span");
                    part.className = exists ? "shape-cell" : "shape-empty";
                    mini.appendChild(part);
                }
            }

            const label = document.createElement("span");
            label.innerHTML = "<span class=\"shape-name\">" + shape.name + "</span><span>占 " + shape.cells.length + " 格</span>";

            const status = document.createElement("span");
            status.className = "shape-status";
            status.textContent = shape.used ? "已放置" : "免费";

            button.appendChild(mini);
            button.appendChild(label);
            button.appendChild(status);
            dom.shapeList.appendChild(button);
        });
    }

    function getShapeBounds(cells) {
        let rows = 0;
        let cols = 0;
        cells.forEach(function (cell) {
            rows = Math.max(rows, cell.row + 1);
            cols = Math.max(cols, cell.col + 1);
        });
        return { rows, cols };
    }

    function renderCellPanel() {
        const cell = state.selectedCell;
        dom.unitButtons.forEach(function (button) {
            button.disabled = state.phase !== "build";
            button.classList.toggle("is-selected", state.selectedUnitType === button.dataset.unit);
        });

        if (!cell) {
            if (state.selectedUnitType) {
                dom.selectedCellText.textContent = "配置模式";
                const newCostText = state.freeBattleGridCredits > 0 ? "剩余 " + state.freeBattleGridCredits + " 个新战斗格免费" : "新建消耗 " + getUnitBuildCost(state.selectedUnitType) + " 金币";
                dom.cellInfo.textContent = "已选择" + UnitDefs[state.selectedUnitType].label + "，点击非核心格配置战斗单位。构建行动 " + state.buildActions + "/" + getBuildActionLimit() + "，指挥 " + getBattleGridCount() + "/" + getCommandLimit() + "，" + newCostText + "，更换消耗 " + CHANGE_UNIT_COST + " 金币。";
            } else {
                dom.selectedCellText.textContent = "未选择地块";
                dom.cellInfo.textContent = "每轮构建行动有限：放置或刷新会消耗 1 点。当前行动 " + state.buildActions + "/" + getBuildActionLimit() + "，指挥 " + getBattleGridCount() + "/" + getCommandLimit() + "。";
            }
            return;
        }

        dom.selectedCellText.textContent = "[" + (cell.col + 1) + "," + (cell.row + 1) + "]";
        if (cell.isCore) {
            dom.cellInfo.textContent = "核心据点格：有效 Lv." + getCellLevel(cell) + "，行 Lv." + getRowLevel(cell.row) + " " + getRowProgress(cell.row) + "/" + LINE_EXP_TO_LEVEL + "，列 Lv." + getColumnLevel(cell.col) + " " + getColumnProgress(cell.col) + "/" + LINE_EXP_TO_LEVEL + "。不可配置战斗单位。";
            return;
        }

        const unit = cell.summonUnitType ? UnitDefs[cell.summonUnitType].label : "未配置";
        const mode = state.selectedUnitType ? " 当前选择：" + UnitDefs[state.selectedUnitType].label + "。" : "";
        const costText = state.selectedUnitType
            ? (getBattleGridCost(cell, state.selectedUnitType) > 0 ? getBattleGridCost(cell, state.selectedUnitType) + " 金币" : "免费")
            : (cell.summonUnitType ? "更换约 " + getBattleGridCost(cell, cell.summonUnitType) + " 金币" : "按单位造价");
        dom.cellInfo.textContent = "阶段 " + getStageLabel(getCellStage(cell)) + "，充能 " + (cell.charge || 0) + "/" + MAX_CELL_CHARGE + "，精通 " + (cell.mastery || 0) + "/" + MAX_CELL_MASTERY + "，开场技 " + (cell.burstReady || 0) + "/" + MAX_BURST_READY + "，指挥 " + getBattleGridCount() + "/" + getCommandLimit() + "，有效 Lv." + getCellLevel(cell) + "，行 Lv." + getRowLevel(cell.row) + " " + getRowProgress(cell.row) + "/" + LINE_EXP_TO_LEVEL + "，列 Lv." + getColumnLevel(cell.col) + " " + getColumnProgress(cell.col) + "/" + LINE_EXP_TO_LEVEL + "，单位：" + unit + "。配置费用：" + costText + "。" + mode;
    }

    function resizeCanvas() {
        const rect = dom.canvas.getBoundingClientRect();
        const dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
        render.width = Math.max(320, rect.width);
        render.height = Math.max(260, rect.height);
        render.dpr = dpr;
        dom.canvas.width = Math.floor(render.width * dpr);
        dom.canvas.height = Math.floor(render.height * dpr);
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function draw(dt) {
        ctx.clearRect(0, 0, render.width, render.height);
        drawBackground();
        drawBoard(dt);
        drawActors();
        drawMessages(dt);
        drawLegend();
    }

    function drawBackground() {
        ctx.fillStyle = "#0d1118";
        ctx.fillRect(0, 0, render.width, render.height);
    }

    function drawBoard(dt) {
        const margin = render.width < 520 ? 14 : 34;
        const showAxes = state.phase === "build";
        const axisLeft = showAxes ? (render.width < 520 ? 38 : 58) : 0;
        const axisBottom = showAxes ? (render.width < 520 ? 32 : 46) : 0;
        const side = Math.min(render.width - margin * 2 - axisLeft, render.height - margin * 2 - axisBottom);
        const x = (render.width - side + axisLeft) / 2;
        const y = (render.height - side - axisBottom) / 2;
        const cellSize = side / GRID_SIZE;
        render.board = { x, y, size: side, cell: cellSize };

        ctx.save();
        ctx.fillStyle = "#111827";
        roundRect(ctx, x - axisLeft - 10, y - 10, side + axisLeft + 20, side + axisBottom + 20, 8);
        ctx.fill();

        for (const cell of state.cells) {
            cell.flash = Math.max(0, cell.flash - dt);
            cell.stageFlash = Math.max(0, (cell.stageFlash || 0) - dt);
            drawCell(cell, x, y, cellSize);
        }

        drawSelectedCell(x, y, cellSize);
        drawPlacementPreview(x, y, cellSize);
        drawCoreOverlay(x, y, cellSize);
        if (showAxes) {
            drawBuildAxes(x, y, side, cellSize, axisLeft, axisBottom);
        }
        ctx.restore();
    }

    function drawCell(cell, boardX, boardY, cellSize) {
        const x = boardX + cell.col * cellSize;
        const y = boardY + cell.row * cellSize;
        const isBuildPhase = state.phase === "build";
        let fill = "#1b2332";
        if (cell.isBattleGrid) fill = "#17324a";
        if (cell.isCore) fill = "#3d321b";
        if (isBuildPhase && cell.filled) fill = blend(cell.blockColor || "#4b6688", cell.isCore ? "#3d321b" : "#1b2332", cell.isCore ? 0.24 : 0.18);
        if (cell.flash > 0) fill = blend(fill, "#ffffff", Math.min(0.45, cell.flash));

        ctx.fillStyle = fill;
        ctx.fillRect(x + 1, y + 1, cellSize - 2, cellSize - 2);

        ctx.strokeStyle = "#303b4d";
        ctx.lineWidth = 1;
        ctx.strokeRect(x + 0.5, y + 0.5, cellSize, cellSize);

        if (isBuildPhase && cell.filled) {
            ctx.fillStyle = cell.blockColor || (cell.isCore ? "#8c6a2d" : "#4b6688");
            ctx.fillRect(x + cellSize * 0.18, y + cellSize * 0.18, cellSize * 0.64, cellSize * 0.64);
        }

        if (cell.isBattleGrid && cell.summonUnitType) {
            const stage = getCellStage(cell);
            ctx.strokeStyle = UnitDefs[cell.summonUnitType].color;
            ctx.lineWidth = 3;
            ctx.strokeRect(x + 4, y + 4, cellSize - 8, cellSize - 8);
            ctx.fillStyle = UnitDefs[cell.summonUnitType].color;
            ctx.font = "800 " + Math.max(12, cellSize * 0.28) + "px Segoe UI, Arial";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText(UnitDefs[cell.summonUnitType].short, x + cellSize / 2, y + cellSize * 0.48);
            drawBattleGridStatus(cell, x, y, cellSize, stage);
        }

    }

    function drawBattleGridStatus(cell, x, y, cellSize, stage) {
        ctx.save();
        const badgeW = Math.max(20, cellSize * 0.36);
        const badgeH = Math.max(13, cellSize * 0.22);
        let badgeColor = stage >= 3 ? "#f6c95f" : stage >= 2 ? "#8bd4ff" : "#223047";
        if (cell.stageFlash > 0) {
            badgeColor = blend(badgeColor, "#ffffff", Math.min(0.5, cell.stageFlash));
        }
        ctx.fillStyle = badgeColor;
        roundRect(ctx, x + cellSize - badgeW - 5, y + 5, badgeW, badgeH, 4);
        ctx.fill();

        ctx.fillStyle = stage >= 2 ? "#0c111a" : "#dbeafe";
        ctx.font = "900 " + Math.max(8, cellSize * 0.14) + "px Segoe UI, Arial";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(getStageLabel(stage), x + cellSize - badgeW / 2 - 5, y + 5 + badgeH / 2);

        const barX = x + 7;
        const barY = y + cellSize - Math.max(11, cellSize * 0.18);
        const barW = cellSize - 14;
        const barH = Math.max(4, cellSize * 0.065);
        ctx.fillStyle = "#0c111a";
        roundRect(ctx, barX, barY, barW, barH, 3);
        ctx.fill();
        ctx.fillStyle = stage >= 3 ? "#f6c95f" : "#8bd4ff";
        roundRect(ctx, barX, barY, barW * Math.min(1, (cell.charge || 0) / MAX_CELL_CHARGE), barH, 3);
        ctx.fill();

        if ((cell.mastery || 0) > 0) {
            ctx.fillStyle = "#f6c95f";
            ctx.font = "900 " + Math.max(8, cellSize * 0.13) + "px Segoe UI, Arial";
            ctx.textAlign = "right";
            ctx.textBaseline = "bottom";
            ctx.fillText("+" + cell.mastery, x + cellSize - 7, barY - 2);
        }

        if (cell.burstReady > 0) {
            ctx.fillStyle = "#f6c95f";
            ctx.font = "900 " + Math.max(9, cellSize * 0.16) + "px Segoe UI, Arial";
            ctx.textAlign = "left";
            ctx.textBaseline = "top";
            ctx.fillText("B" + cell.burstReady, x + 6, y + 5);
        }
        ctx.restore();
    }

    function drawSelectedCell(boardX, boardY, cellSize) {
        const cell = state.selectedCell;
        if (!cell || state.phase !== "build") return;
        const x = boardX + cell.col * cellSize;
        const y = boardY + cell.row * cellSize;
        ctx.save();
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = Math.max(2, cellSize * 0.06);
        ctx.strokeRect(x + 3, y + 3, cellSize - 6, cellSize - 6);
        ctx.strokeStyle = cell.isCore ? "#f6c95f" : "#8bd4ff";
        ctx.lineWidth = Math.max(2, cellSize * 0.035);
        ctx.strokeRect(x + 7, y + 7, cellSize - 14, cellSize - 14);
        ctx.restore();
    }

    function drawBuildAxes(boardX, boardY, boardSize, cellSize, axisLeft, axisBottom) {
        ctx.save();
        const levelFont = "800 " + Math.max(9, Math.min(13, cellSize * 0.2)) + "px Segoe UI, Arial";
        const progressFont = "700 " + Math.max(8, Math.min(11, cellSize * 0.16)) + "px Segoe UI, Arial";
        ctx.strokeStyle = "#3a4558";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(boardX - 6, boardY);
        ctx.lineTo(boardX - 6, boardY + boardSize);
        ctx.moveTo(boardX, boardY + boardSize + 6);
        ctx.lineTo(boardX + boardSize, boardY + boardSize + 6);
        ctx.stroke();

        for (let row = 0; row < GRID_SIZE; row += 1) {
            const y = boardY + row * cellSize;
            const centerY = y + cellSize / 2;
            const progress = getRowProgress(row);
            const x = boardX - axisLeft + 8;

            ctx.fillStyle = "#17202d";
            roundRect(ctx, x, y + 3, axisLeft - 14, cellSize - 6, 5);
            ctx.fill();

            ctx.fillStyle = "#dbeafe";
            ctx.font = levelFont;
            ctx.textAlign = "left";
            ctx.textBaseline = "middle";
            ctx.fillText("Lv." + getRowLevel(row), x + 5, centerY - cellSize * 0.16);

            ctx.fillStyle = "#68d391";
            ctx.font = progressFont;
            ctx.fillText(progress + "/" + LINE_EXP_TO_LEVEL, x + 5, centerY + cellSize * 0.18);
            drawAxisTicks(x + 5, y + cellSize - 8, axisLeft - 24, progress, "#68d391");
        }

        for (let col = 0; col < GRID_SIZE; col += 1) {
            const x = boardX + col * cellSize;
            const progress = getColumnProgress(col);
            const y = boardY + boardSize + 7;

            ctx.fillStyle = "#17202d";
            roundRect(ctx, x + 3, y, cellSize - 6, axisBottom - 12, 5);
            ctx.fill();

            ctx.fillStyle = "#dbeafe";
            ctx.font = levelFont;
            ctx.textAlign = "center";
            ctx.textBaseline = "top";
            ctx.fillText("Lv." + getColumnLevel(col), x + cellSize / 2, y + 4);

            ctx.fillStyle = "#60a5fa";
            ctx.font = progressFont;
            ctx.fillText(progress + "/" + LINE_EXP_TO_LEVEL, x + cellSize / 2, y + Math.max(17, axisBottom * 0.48));
            drawAxisTicks(x + 8, y + axisBottom - 11, cellSize - 16, progress, "#60a5fa");
        }
        ctx.restore();
    }

    function drawAxisTicks(x, y, width, progress, color) {
        const tickGap = 2;
        const tickWidth = Math.max(1, (Math.max(12, width) - tickGap * (LINE_EXP_TO_LEVEL - 1)) / LINE_EXP_TO_LEVEL);
        for (let index = 0; index < LINE_EXP_TO_LEVEL; index += 1) {
            ctx.fillStyle = index < progress ? color : "#0c111a";
            ctx.fillRect(x + index * (tickWidth + tickGap), y, tickWidth, 3);
        }
    }

    function drawPlacementPreview(boardX, boardY, cellSize) {
        if (state.phase !== "build" || !render.hoverCell) return;
        const shape = state.shapes[state.selectedShapeIndex];
        if (!shape && state.selectedUnitType) {
            const cell = getCell(render.hoverCell.row, render.hoverCell.col);
            const x = boardX + render.hoverCell.col * cellSize;
            const y = boardY + render.hoverCell.row * cellSize;
            ctx.strokeStyle = cell && !cell.isCore ? UnitDefs[state.selectedUnitType].color : "#ef6f6c";
            ctx.lineWidth = 3;
            ctx.strokeRect(x + 4, y + 4, cellSize - 8, cellSize - 8);
            return;
        }
        if (!shape) {
            const x = boardX + render.hoverCell.col * cellSize;
            const y = boardY + render.hoverCell.row * cellSize;
            ctx.strokeStyle = "#8bd4ff";
            ctx.lineWidth = 2;
            ctx.strokeRect(x + 3, y + 3, cellSize - 6, cellSize - 6);
            return;
        }

        const check = canPlaceShape(shape, render.hoverCell.row, render.hoverCell.col);
        ctx.globalAlpha = 0.65;
        ctx.fillStyle = check.ok ? shape.color : "#ef6f6c";
        for (const part of shape.cells) {
            const row = render.hoverCell.row + part.row;
            const col = render.hoverCell.col + part.col;
            if (row < 0 || row >= GRID_SIZE || col < 0 || col >= GRID_SIZE) continue;
            const x = boardX + col * cellSize;
            const y = boardY + row * cellSize;
            ctx.fillRect(x + 5, y + 5, cellSize - 10, cellSize - 10);
        }
        ctx.globalAlpha = 1;
    }

    function drawCoreOverlay(boardX, boardY, cellSize) {
        const x = boardX + CORE_MIN * cellSize;
        const y = boardY + CORE_MIN * cellSize;
        const size = 2 * cellSize;
        ctx.save();
        ctx.strokeStyle = "#f6c95f";
        ctx.lineWidth = 4;
        ctx.strokeRect(x + 4, y + 4, size - 8, size - 8);
        ctx.fillStyle = "#f6c95f";
        ctx.font = "900 " + Math.max(14, cellSize * 0.3) + "px Segoe UI, Arial";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("CORE", x + size / 2, y + size / 2);
        ctx.restore();
    }

    function drawActors() {
        if (state.phase !== "battle") return;
        const board = render.board;
        for (const actor of state.actors) {
            const screen = gridToScreen(actor.x, actor.y);
            const color = actor.team === "enemy" ? EnemyDef.color : UnitDefs[actor.kind].color;
            const radiusScale = actor.team === "player" ? (actor.radius || 0.18) : 0.18;
            const radius = Math.max(7, board.cell * radiusScale);

            ctx.save();
            ctx.fillStyle = actor.hitFlash > 0 ? "#ffffff" : color;
            ctx.beginPath();
            ctx.arc(screen.x, screen.y, radius, 0, Math.PI * 2);
            ctx.fill();
            ctx.lineWidth = 2;
            ctx.strokeStyle = actor.team === "enemy" ? "#7f1d1d" : "#e0f2fe";
            ctx.stroke();

            ctx.fillStyle = "#ffffff";
            ctx.font = "800 " + Math.max(10, board.cell * 0.18) + "px Segoe UI, Arial";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            const label = actor.team === "enemy" ? "E" : UnitDefs[actor.kind].short + (actor.stage >= 2 ? actor.stage : "");
            ctx.fillText(label, screen.x, screen.y);

            const hpWidth = radius * 2.4;
            const hpRatio = Math.max(0, actor.hp / actor.maxHp);
            ctx.fillStyle = "#0c111a";
            ctx.fillRect(screen.x - hpWidth / 2, screen.y - radius - 9, hpWidth, 4);
            ctx.fillStyle = actor.team === "enemy" ? "#fb7185" : "#68d391";
            ctx.fillRect(screen.x - hpWidth / 2, screen.y - radius - 9, hpWidth * hpRatio, 4);
            ctx.restore();
        }
    }

    function drawMessages(dt) {
        render.messages = render.messages.filter(function (message) {
            message.time -= dt;
            return message.time > 0;
        });

        for (const message of render.messages) {
            const alpha = Math.max(0, message.time / message.maxTime);
            ctx.save();
            ctx.globalAlpha = alpha;
            if (message.type === "line") {
                const from = gridToScreen(message.fromX, message.fromY);
                const to = gridToScreen(message.toX, message.toY);
                if (message.style === "core") {
                    ctx.strokeStyle = message.color;
                    ctx.lineWidth = 4;
                    ctx.beginPath();
                    ctx.moveTo(from.x, from.y);
                    ctx.lineTo(to.x, to.y);
                    ctx.stroke();

                    ctx.globalAlpha = alpha * 0.32;
                    ctx.strokeStyle = "#fff7ad";
                    ctx.lineWidth = 9;
                    ctx.beginPath();
                    ctx.moveTo(from.x, from.y);
                    ctx.lineTo(to.x, to.y);
                    ctx.stroke();
                } else if (message.style === "heal") {
                    ctx.strokeStyle = message.color;
                    ctx.lineWidth = 3;
                    ctx.setLineDash([7, 5]);
                    ctx.beginPath();
                    ctx.moveTo(from.x, from.y);
                    ctx.lineTo(to.x, to.y);
                    ctx.stroke();
                    ctx.setLineDash([]);
                } else {
                    const dx = to.x - from.x;
                    const dy = to.y - from.y;
                    const length = Math.max(1, Math.sqrt(dx * dx + dy * dy));
                    const progress = 1 - alpha;
                    const headX = from.x + dx * progress;
                    const headY = from.y + dy * progress;
                    const tailX = headX - (dx / length) * 28;
                    const tailY = headY - (dy / length) * 28;

                    ctx.strokeStyle = message.color;
                    ctx.lineWidth = 2;
                    ctx.beginPath();
                    ctx.moveTo(tailX, tailY);
                    ctx.lineTo(headX, headY);
                    ctx.stroke();

                    ctx.fillStyle = "#dbeafe";
                    ctx.beginPath();
                    ctx.arc(headX, headY, 3, 0, Math.PI * 2);
                    ctx.fill();
                }
            } else if (message.type === "wave") {
                const board = render.board;
                const progress = 1 - alpha;
                ctx.strokeStyle = message.color;
                ctx.lineWidth = Math.max(3, board.cell * 0.08);
                ctx.globalAlpha = alpha * 0.78;
                ctx.beginPath();
                if (message.axis === "row") {
                    const y = board.y + (message.index + 0.5) * board.cell;
                    const head = board.x + board.size * progress;
                    ctx.moveTo(board.x, y);
                    ctx.lineTo(head, y);
                } else {
                    const x = board.x + (message.index + 0.5) * board.cell;
                    const head = board.y + board.size - board.size * progress;
                    ctx.moveTo(x, board.y + board.size);
                    ctx.lineTo(x, head);
                }
                ctx.stroke();
            } else if (message.type === "pulse") {
                const center = gridToScreen(message.x, message.y);
                const radius = render.board.cell * message.radius * (1.12 - alpha * 0.28);
                ctx.strokeStyle = message.color;
                ctx.lineWidth = Math.max(2, render.board.cell * 0.05);
                ctx.globalAlpha = alpha * 0.7;
                ctx.beginPath();
                ctx.arc(center.x, center.y, radius, 0, Math.PI * 2);
                ctx.stroke();
            } else {
                const pos = gridToScreen(message.x, message.y - (1 - alpha) * 0.45);
                ctx.fillStyle = message.color;
                ctx.font = "800 16px Segoe UI, Arial";
                ctx.textAlign = "center";
                ctx.textBaseline = "middle";
                ctx.fillText(message.text, pos.x, pos.y);
            }
            ctx.restore();
        }
    }

    function drawLegend() {
        const items = state.phase === "build"
            ? [["构建块", "#60a5fa"], ["战斗格", "#4eb5ff"], ["核心", "#f6c95f"]]
            : [["战斗格", "#4eb5ff"], ["敌人", EnemyDef.color], ["核心", "#f6c95f"]];
        const x = 16;
        let y = 18;
        ctx.save();
        ctx.font = "700 13px Segoe UI, Arial";
        ctx.textAlign = "left";
        ctx.textBaseline = "middle";
        for (const item of items) {
            ctx.fillStyle = item[1];
            ctx.fillRect(x, y - 6, 12, 12);
            ctx.fillStyle = "#cbd5e1";
            ctx.fillText(item[0], x + 18, y);
            y += 20;
        }
        ctx.restore();
    }

    function gridToScreen(x, y) {
        return {
            x: render.board.x + x * render.board.cell,
            y: render.board.y + y * render.board.cell
        };
    }

    function roundRect(context, x, y, width, height, radius) {
        context.beginPath();
        context.moveTo(x + radius, y);
        context.lineTo(x + width - radius, y);
        context.quadraticCurveTo(x + width, y, x + width, y + radius);
        context.lineTo(x + width, y + height - radius);
        context.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
        context.lineTo(x + radius, y + height);
        context.quadraticCurveTo(x, y + height, x, y + height - radius);
        context.lineTo(x, y + radius);
        context.quadraticCurveTo(x, y, x + radius, y);
        context.closePath();
    }

    function blend(hexA, hexB, amount) {
        const a = parseHex(hexA);
        const b = parseHex(hexB);
        const mix = function (from, to) {
            return Math.round(from + (to - from) * amount);
        };
        return "rgb(" + mix(a.r, b.r) + "," + mix(a.g, b.g) + "," + mix(a.b, b.b) + ")";
    }

    function parseHex(hex) {
        const clean = hex.replace("#", "");
        return {
            r: parseInt(clean.slice(0, 2), 16),
            g: parseInt(clean.slice(2, 4), 16),
            b: parseInt(clean.slice(4, 6), 16)
        };
    }

    function updateGoldGainFx(dt) {
        if (state.goldGainFx.time <= 0) return;
        state.goldGainFx.time = Math.max(0, state.goldGainFx.time - dt);
        if (state.goldGainFx.time === 0 && dom.goldStat) {
            dom.goldStat.classList.remove("is-gold-bonus");
            dom.goldStat.removeAttribute("data-interest-gain");
        }
    }

    function tick(time) {
        if (!state.lastTime) state.lastTime = time;
        const dt = Math.min(0.05, (time - state.lastTime) / 1000);
        state.lastTime = time;

        if (state.phase === "battle") updateBattle(dt);
        updateGoldGainFx(dt);
        updateUI();
        draw(dt);
        window.requestAnimationFrame(tick);
    }

    function bindEvents() {
        dom.startGameButton.addEventListener("click", function () {
            if (state.phase === "idle") {
                resetGame();
            } else {
                showConfirm(
                    "确认重置游戏",
                    "当前棋盘、金币、战斗格和轮次都会被清空，确认回到初始状态吗？",
                    resetToIdle
                );
            }
        });
        dom.confirmCancelButton.addEventListener("click", hideConfirm);
        dom.confirmOkButton.addEventListener("click", confirmPendingAction);
        dom.confirmOverlay.addEventListener("click", function (event) {
            if (event.target === dom.confirmOverlay) hideConfirm();
        });
        dom.startBattleButton.addEventListener("click", startBattle);
        dom.rotateButton.addEventListener("click", rotateSelectedShape);
        dom.refreshShapesButton.addEventListener("click", refreshShapes);
        dom.canvas.addEventListener("pointerdown", handleCanvasPointerDown, { passive: false });
        dom.canvas.addEventListener("pointermove", handleCanvasMove);
        dom.canvas.addEventListener("pointerleave", function () {
            render.hoverCell = null;
        });
        dom.unitButtons.forEach(function (button) {
            button.addEventListener("click", function () {
                selectUnit(button.dataset.unit);
            });
        });
        window.addEventListener("keydown", function (event) {
            if (event.key === "Escape" && !dom.confirmOverlay.hidden) {
                hideConfirm();
                return;
            }
            if (event.key === "r" || event.key === "R") rotateSelectedShape();
            if (event.code === "Space" && state.phase === "build") {
                event.preventDefault();
                startBattle();
            }
        });
        window.addEventListener("resize", function () {
            resizeCanvas();
            markDirty();
        });
        if ("ResizeObserver" in window) {
            const observer = new ResizeObserver(function () {
                resizeCanvas();
                markDirty();
            });
            observer.observe(dom.canvas);
        }
    }

    function boot() {
        bindEvents();
        resizeCanvas();
        pushLog("点击“开始游戏”进入原型。");
        updateUI();
        window.requestAnimationFrame(tick);
    }

    boot();
}());
