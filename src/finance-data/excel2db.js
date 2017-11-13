let mysql = require('mysql');
let XLSX = require('xlsx');
let common = require('../common/common.js');

let files = [
    "不复权_StockHistoryPrice.xlsx",
    "前复权_StockHistoryPrice.xlsx",
    "后复权_StockHistoryPrice.xlsx",
    "StockStructure.xlsx",
    "benefit_report.xls",
    "cash_report.xls",
    "debt_report.xls"
];

const tableNameSuffixs = [
    "_StockHistoryPrice_N", //不复权
    "_StockHistoryPrice_F", //前复权
    "_StockHistoryPrice_B", //后复权
    "_StockStructure", // 股本结构
    "_BenefitReport", //收益
    "_CashReport", //现金
    "_DebtReport" //负债
];
const sqlPrefix = "CREATE TABLE IF NOT EXISTS `";

let sleep = function(delay) {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            resolve();
        }, delay);
    });
}


module.exports.excel2db = function(stock) {

    var connection = mysql.createConnection({
        host: '203.195.179.183',
        port: '3832',
        user: 'root',
        password: 'root123!!!',
        database: 'stocks'
    });

    connection.connect(function(err) {
        if (err) {
            console.error('error connecting: ' + err.stack);
            return;
        }
        console.log('connected as id ' + connection.threadId);
    });

    if (stock.codeA == "sh000001") {
        files = [
            "不复权_StockHistoryPrice.xlsx"
        ];
    }

    // (async() => {
    for (var index = 0; index < files.length; index++) {
        let fileName = files[index];

        let filePath = common.getBasePathP(stock) + "/" + fileName;
        let tableName = getTableName(stock.code, index);
        let tableHeader;

        let book = XLSX.readFileSync(filePath);
        let sheet = book.Sheets[book.SheetNames[0]];
        let array2D = XLSX.utils.sheet_to_json(sheet, { header: 1 });

        if (array2D.length == 1 || array2D.length == 0) {
            console.error("FAIL_ 股票代码:" + stock.code + ", 股票名称:" + stock.name + "信息缺失请手动检查, 文件名称:", fileName);
            continue;
        }
        let resultArray;
        switch (index) {
            case 0: //不复权_StockHistoryPrice.xlsx
            case 1: //前复权_StockHistoryPrice.xlsx
            case 2: //后复权_StockHistoryPrice.xlsx
            case 3: //StockStructure.xlsx            
                resultArray = array2D.slice(1);
                tableHeader = array2D[0];
                break;
            case 4:
            case 5:
            case 6:
                let tempArray2D = array2D.slice(1); //去除第一行空数据
                let transposeMatrix = common.transposeMatrix(tempArray2D);
                resultArray = transposeMatrix.slice(1);
                tableHeader = transposeMatrix[0];
                break;
        }

        //create the table
        let createTableSQL = generateCreateSQLByHeader(tableHeader, tableName);
        var query = connection.query(createTableSQL, function(err, result) {
            if (err) {
                console.log("sql ==>", createTableSQL);
                console.error('error create: ' + err.stack)
                throw err;
            }
            // else {
            //     console.log("创建表成功, tableName ==> ", tableName);
            // }
        });

        let truncatTableSQL = "TRUNCATE TABLE " + tableName;
        connection.query(truncatTableSQL, function(err, result) {
            if (err) {
                console.error('error create: ' + err.stack)
                throw err;
            }
            // else {
            //     console.log("清空数据成功, tableName ==> ", tableName);
            // }
        });

        console.log("股票代码: " + stock.code + ", table:" + tableName + " 数据入库中...........");

        let sqlPre = "INSERT INTO " + tableName + "(??) values";
        let insertSQL = mysql.format(sqlPre, [tableHeader]);

        for (var arrayIndex = 0; arrayIndex < resultArray.length; arrayIndex++) {
            let row = resultArray[arrayIndex];
            insertSQL = insertSQL + "(";

            row.forEach((item, itemIndex) => {
                if (typeof(item) == 'undefined') {
                    item = "";
                }
                if (itemIndex == (row.length - 1)) {
                    insertSQL = insertSQL + "'" + item + "')";
                } else {
                    insertSQL = insertSQL + "'" + item + "', ";
                }
            });

            if (arrayIndex != resultArray.length - 1) {
                insertSQL = insertSQL + ",";
            }
        };
        connection.query(insertSQL, function(err, results) {
            if (err) {
                console.log("sql ==>", insertSQL);
                // console.log("row ==>", row);
                console.error('error insert: ' + err.stack)
                throw err;
            }
        });
        // await sleep(500);
    }
    // })();

    connection.end(function(err) {
        // The connection is terminated now
        console.log("股票代码: " + stock.code + " 数据入库完成!");
    });
}


function getTableName(stockCode, suffixIndex) {
    let tableName = stockCode + tableNameSuffixs[suffixIndex]
    return tableName;
}

function generateCreateSQLByHeader(tableHeader, tableName) {
    let createSQL = sqlPrefix + tableName;
    createSQL = createSQL + "` (\n" +
        "            `id` int(11) unsigned NOT NULL AUTO_INCREMENT,\n";
    tableHeader.forEach(header => {
        createSQL = createSQL + "            `" + header + "` varchar(100) DEFAULT NULL,\n";
    })

    createSQL = createSQL + "        PRIMARY KEY (id)\n" +
        "      )  ENGINE=INNODB DEFAULT CHARACTER SET=UTF8;";

    return createSQL;
}