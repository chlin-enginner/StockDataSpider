// 下载股票数据相关
// 下载股票的每日历史数据
// 下载股票的股本结构
// 下载股票的财务数据
// 下载上证指数历史数据

let downloadExcel = require("../finance-data/download_excel.js");
let stock_structure = require("./stock_structure.js");
let tencent_api = require("./tencent_api.js");
let excel2db = require("../finance-data/excel2db.js");
let common = require('../common/common.js');

const stocksJSON = require("../finance-data/all-stock-codes.json");
// let stocksJSON = [
//     { "code": "600025", "codeA": "sh600025", "name": "华能水电" }
// ];

let failedStocks = [];

let sleep = function(delay) {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            resolve();
        }, delay);
    });
}

// tencent_api.DownloadStockHistory({
//         name: "上证指数",
//         code: "000001",
//         codeA: "sh000001"
//     }).then(r => console.log("上证指数", "1A0001", "==> 下载股价历史数据  OK"))
//     .catch(e => console.log("上证指数", "1A0001", "==> 下载股价历史数据  FAIL", e));


//下载财务数据和股价历史数据, sleep 500就OK
//下载股本结构数据需要sleep 1100, 要不然可能会被新浪认为是爬虫程序, 封禁ip
// let start = async function() {
//     for (var i = 0; i < stocksJSON.length; i++) {
//         let stock = stocksJSON[i];
//         //  下载财务数据
//         // downloadExcel.downloadExcel(stock)
//         //     .then(r => console.log(stock.name, stock.code, "==> 下载财务数据  OK"))
//         //     .catch(e => {
//         //         failedStocks.push(stock);
//         //         console.log(stock.name, stock.code, "==> 下载财务数据  FAIL_", e);
//         //     });

//         // 下载股价历史数据
//         // tencent_api.DownloadStockHistory(stock)
//         //     .then(r => console.log(stock.name, stock.code, "==> 下载股价历史数据  OK"))
//         //     .catch(e => {
//         //         failedStocks.push(stock);
//         //         console.log(stock.name, stock.code, "==> 下载股价历史数据  FAIL_", e);
//         //     });

//         // //下载股本结构数据
//         stock_structure.DownloadStockStructure(stock.code, stock.name)
//             .then(r => console.log(stock.name, stock.code, "==> 下载股本结构数据  OK"))
//             .catch(e => {
//                 failedStocks.push(stock);
//                 console.log(stock.name, stock.code, "==> 下载股本结构数据  FAIL_", e);
//             });
//         await Promise.resolve(sleep(1100));
//     }
// };

// start().then(result => console.log("failedStocks", failedStocks));


let excelParse = async function() {
    for (var i = 0; i < stocksJSON.length; i++) {
        let stock = stocksJSON[i];
        try {
            excel2db.excel2db(stock);
        } catch (error) {
            failedStocks.push(stock);
            console.log(stock.name, stock.code, "==> 数据入库失败  FAIL_", error);
        }

        await sleep(2000);
    }
};

excelParse();