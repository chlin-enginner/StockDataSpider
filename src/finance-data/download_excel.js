// 根据股票代码下载上市公司的财务报表数据
// 数据来源:同花顺数据中心
// 数据格式:excel(xls)
// 文件存放路径: ./excels/股票代码/excel文件

let request = require('request');
let Q = require('q');
let fs = require('fs');
let Iconv = require('iconv-lite');
let XLSX = require('xlsx');
let common = require('../common/common.js');



const BaseURL = "http://basic.10jqka.com.cn/api/stock/export.php?export=";
const dataApis = [
    "debt",
    "cash",
    "benefit"
];

module.exports.downloadExcel = function(stock) {
    return Q.Promise((resolve, reject) => {
        let success = [];
        let errors = [];
        let result = {};

        result.success = success;
        result.errors = errors;

        dataApis.forEach(api => {
            downloadExcelReq(stock, api)
                .then(r => {
                    success.push(api);
                    if (success.length === dataApis.length) {
                        result.path = common.getBasePathP(stock);
                        resolve(result);
                    }
                }).catch(e => {
                    errors.push(e);
                    if ((errors.length + success.length) === dataApis.length) {
                        reject(result);
                    }
                });
        });
    });
};

function downloadExcelReq(stock, api) {
    let url = BaseURL + api + "&type=report&code=" + stock.code;
    // console.log("url:", url);
    let path = common.getBasePathP(stock) + "/" + api + "_report.xls";

    return Q.Promise(function(resolve, reject) {
        request.get(url)
            .on('response', response => {
                if (200 !== response.statusCode ||
                    response.headers['content-type'].indexOf("application/vnd.ms-excel") == -1) {
                    console.log("error url =====>", url);
                    reject("failed");
                }
            }).on('error', function(err) {
                reject(err);
            }).pipe(fs.createWriteStream(path).on("close", err => {
                if (err) reject(err);
                // console.log("download ===>", path, "OK");
                resolve("OK");
            }));
    });
}