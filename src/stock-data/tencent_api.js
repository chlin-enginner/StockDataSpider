/**
 * 获取指定股票代码的历史股价数据
 * <p>
 *    数据来源:腾讯数据中心
 * </p>
 */
let request = require('request');
let Q = require('q');
let excelPort = require('excel-export');
let fs = require('fs');
let common = require('../common/common.js');
let Iconv = require('iconv-lite');


// "http://web.ifzq.gtimg.cn/appstock/app/fqkline/get?_var=kline_dayhfq&param=sh600050,day,,,-1,hfq&r="
// http://web.ifzq.gtimg.cn/appstock/app/kline/kline?_var=kline_day&param=sh600519,day,,,320,&r=0.7267764700505841
// 股价查询参数
let params = [{
        apiPrefix: "http://web.ifzq.gtimg.cn/appstock/app/fqkline/get?_var=kline_dayqfq&param=",
        apiSuffix: ",day,,,2000,qfq&r=",
        jsonName: "kline_dayqfq=",
        jsonAttr: "qfqday",
        title: "前复权"
    },
    {
        apiPrefix: "http://web.ifzq.gtimg.cn/appstock/app/fqkline/get?_var=kline_dayhfq&param=",
        apiSuffix: ",day,,,2000,hfq&r=",
        jsonName: "kline_dayhfq=",
        jsonAttr: "hfqday",
        title: "后复权"
    },
    {
        apiPrefix: "http://web.ifzq.gtimg.cn/appstock/app/kline/kline?_var=kline_day&param=",
        apiSuffix: ",day,,,2000,&r=",
        jsonName: "kline_day=",
        jsonAttr: "day",
        title: "不复权"
    }
];

let param_000001 = [{
    apiPrefix: "http://web.ifzq.gtimg.cn/appstock/app/fqkline/get?_var=kline_dayqfq&param=",
    apiSuffix: ",day,,,2000,qfq&r=",
    jsonName: "kline_dayqfq=",
    jsonAttr: "day",
    title: "前复权"
}];

// 表格标题
let excelTitles = [{
        caption: '日期',
        type: 'string',
        width: 80
    },
    {
        caption: '开盘价',
        type: 'string',
        width: 30
    },
    {
        caption: '最高价',
        type: 'string',
        width: 30
    },
    {
        caption: '最低价',
        type: 'string',
        width: 30
    },
    {
        caption: '收盘价',
        type: 'string',
        width: 30
    },
    {
        caption: '成交量',
        type: 'string',
        width: 80
    }
];

// 下载股价历史数据
module.exports.DownloadStockHistory = function(stock) {
    return Q.Promise((resolve, reject) => {
        let back = {};
        back.success = false;
        back.result = [];
        back.errors = [];
        if (stock.codeA == "sh000001") {
            param_000001.forEach(param => {
                getHistoryStockPrice(stock, param).then(result2DArray => {
                        return outExcel(stock, result2DArray, param);
                    }).then(result => {
                        back.result.push(result);
                        if ((back.result.length + back.errors.length) === param_000001.length) {
                            back.success = true;
                            resolve(back);
                        }
                    })
                    .catch(e => {
                        back.errors.push(e);
                        if ((back.result.length + back.errors.length) === param_000001.length) {
                            reject(back);
                        }
                    });
            });
        } else {
            params.forEach(param => {
                getHistoryStockPrice(stock, param).then(result2DArray => {
                    return outExcel(stock, result2DArray, param);
                }).then(result => {
                    // console.log("result");
                    back.result.push(result);
                    if ((back.result.length + back.errors.length) === params.length) {
                        back.success = true;
                        resolve(back);
                    }
                }).catch(e => {
                    // console.log("result");
                    back.errors.push(e);
                    if ((back.result.length + back.errors.length) === params.length) {
                        reject(back);
                    }
                });
            });
        }

    });
};

function reqOpt(url) {
    return {
        headers: {
            "Accept": "*/*",
            "Content-Type": "text/html; charset=UTF-8",
            "Connection": "keep-alive",
            "Accept-Language": "zh,zh-CN;q=0.8,en-US;q=0.6,en;q=0.4",
            "Accept-Encoding": "gzip, deflate",
            "Host": "web.ifzq.gtimg.cn",
            "Cache-Control": "no-cache",
            "Pragma": "no-cache",
            "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/61.0.3163.100 Safari/537.36",
        },
        url: url,
        method: "GET",
        gzip: true
    };
}

function reqApi(opt) {
    return Q.Promise(function(resolve, reject) {
        var req = request(opt, function(error, response, data) {
            if (error) {
                // console.error("error url:", opt.url);
                reject(error);
            } else {
                if (response.statusCode === 200) {
                    resolve(data);
                } else {
                    let result = {};
                    result.path = opt.url;
                    result.statusCode = response.statusCode;
                    result.data = data;
                    result.error = error;
                    reject(result);
                }
            }
        });
        req.end();
    });
}


function getHistoryStockPrice(stock, param) {
    let url = param.apiPrefix + stock.codeA + param.apiSuffix + Math.random();
    let opt = reqOpt(url);

    return Q.promise(function(resolve, reject) {

        reqApi(opt).then(function(result) {
            let str = result.replace(param.jsonName, "");

            let json = JSON.parse(str);

            let attr1 = stock.codeA;
            let attr2 = param.jsonAttr;
            let attr22 = "day";

            let result2DArray;

            for (var l1Key in json.data) { //list<map>
                if (l1Key == attr1) {
                    var l1Value = json.data[l1Key];
                    for (var l2Key in l1Value) {
                        if (l2Key == attr2 || l2Key == attr22) {
                            result2DArray = l1Value[l2Key];
                        }
                    }
                }
            }
            resolve(result2DArray);
        });
    });
}

function outExcel(stock, execlData, param) {
    return Q.promise((resolve, reject) => {
        let conf = {};
        let filename = param.title + "_StockHistoryPrice";
        conf.cols = excelTitles;
        let array = [];
        array.push(execlData);

        conf.rows = array[0];
        let result = excelPort.execute(conf);

        // let random = Math.floor(Math.random() * 10000);
        let basepath = [];
        let path;
        basepath.push("excels");
        path = basepath.join("/");
        common.mkdir(path);

        basepath.push(stock.name + "_" + stock.code);
        path = basepath.join("/");
        common.mkdir(path);

        let filePath = path + "/" + filename + ".xlsx";

        fs.writeFile(filePath, result, 'binary', function(err) {
            if (err) {
                reject(err);
            } else {
                resolve("OK");
            }
        });
    });
}