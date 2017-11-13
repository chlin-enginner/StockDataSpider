//
let request = require('request');
let Q = require('q');
let fs = require('fs');
let cheerio = require("cheerio");
let Iconv = require('iconv-lite');
let BasePath = "http://vip.stock.finance.sina.com.cn/corp/go.php/vCI_StockStructure/stockid/";
let regex = new RegExp("(\\d+\\.{0,1}\\d+) 万股");
let XLSX = require('xlsx');
let common = require('../common/common.js');

module.exports.DownloadStockStructure = function(code, title) {
    return new Promise((resolve, reject) => {
        StockStructure(code, title)
            .then(data => {
                return outExcel(code, title, data);
            })
            .then(f => resolve(f))
            .catch(e => reject(e));
    });
};

function StockStructure(code, title) {
    return new Promise((resolve, reject) => {
        try {
            let url = BasePath + code + ".phtml";
            var req = request.get({
                encoding: null,
                url: url
            }, (error, response, data) => {
                if (error) {
                    reject(error);
                    return false;
                }
                if (200 !== response.statusCode) {
                    console.log("statusCode:", response.statusCode);
                    reject("failed");
                    return false;
                }
                data = Iconv.decode(data, "gb2312").toString();
                let $ = cheerio.load(data);
                let tabs = $("table", "#con02-1");
                let titles = [];
                // tables
                Object.keys(tabs).forEach(t => {
                    if (isNaN(Number(t))) {
                        return false;
                    }
                    let trs = $(tabs[t]).find("tbody tr");

                    let titlesFlag = false;
                    if (titles.length === 0) {
                        titlesFlag = true;
                    }
                    let i = 0;
                    // trs
                    Object.keys(trs).forEach(k => {
                        let trindex = Number(k);
                        if (isNaN(trindex)) {
                            return false;
                        }
                        if (trindex === 2) {
                            return false;
                        }
                        let tds = $(trs[k]).find("td");

                        // tds
                        Object.keys(tds).forEach(d => {
                            let index = Number(d);
                            if (isNaN(index)) {
                                return false;
                            }
                            let value = $(tds[index]).text();
                            let rangs = regex.exec(value);
                            if (rangs) {
                                value = rangs[1];
                            } else if (value === '--') {
                                value = "";
                            }
                            if (titlesFlag && index === 0) {
                                let datas = [];
                                datas.push(value);
                                titles[i] = datas;
                                return false;
                            }
                            if (index === 0) {
                                return false;
                            }
                            titles[i].push(value);
                        });
                        i++;
                    });

                });
                resolve(titles);
            });
            req.end();
        } catch (e) {
            reject(e);
        }
    });
}

function outExcel(code, title, execlData) {
    return new Promise((resolve, reject) => {
        try {
            var excelData2 = common.transposeMatrix(execlData);
            var wb = XLSX.utils.book_new();
            var ws = XLSX.utils.aoa_to_sheet(excelData2, { cellDates: true });
            XLSX.utils.book_append_sheet(wb, ws, "sheet1");

            let filename = "StockStructure.xlsx";

            let basepath = [];
            let path;
            basepath.push("excels");
            path = basepath.join("/");
            common.mkdir(path);

            basepath.push(title + "_" + code);
            path = basepath.join("/");
            common.mkdir(path);

            let filePath = path + "/" + filename;
            XLSX.writeFile(wb, filePath, { bookSST: true });
            // console.log(code, title, "保存股本结构数据到Excel", "OK")
            resolve("OK");

        } catch (e) {
            reject(e);
            console.log(e);
        }
    });
}

// StockStructure("601857", "中国石油");