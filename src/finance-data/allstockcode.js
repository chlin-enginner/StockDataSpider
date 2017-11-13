// 下载所有股票代码

//
let request = require('request');
let Q = require('q');
let excelPort = require('excel-export');
let fs = require('fs');
let cheerio = require("cheerio");
let Iconv = require('iconv-lite');
let regexp = new RegExp("\\(((0|6|9|4|8)\\d+)\\)$")

let ignoredStocks = ["600296", "600349", "031005", "031007", "038011", "038014", "038015",
    "038016", "038017", "000508", "000991", "031007", "600991", "601299", "002720", "002710"
];

function stocklist() {
    let url = "http://quote.eastmoney.com/stocklist.html";
    return new Promise((resolve, reject) => {
        try {
            request.get({
                encoding: null,
                url: url
            }, (error, response, data) => {
                if (error) {
                    reject(error);
                } else if (response && 200 === response.statusCode) {
                    // console.log()
                    // console.log(data)
                    data = Iconv.decode(data, "gb2312").toString();
                    let $ = cheerio.load(data);

                    let as = $("ul li a", "#quotesearch");

                    // console.log(as)
                    let keys = Object.keys(as)
                    let datas = [];
                    keys.forEach(k => {
                        // console.log(k);

                        if (isNaN(Number(k))) {
                            return false;
                        }
                        let str = $(as[k]).text();
                        let href = $(as[k]).attr("href");

                        let rangs = regexp.exec(str);
                        if (rangs) {
                            let stock = {};
                            let stockCode = href.replace("http://quote.eastmoney.com/", "").replace(".html", "");

                            stock.code = rangs[1];
                            stock.codeA = stockCode;
                            stock.name = str.replace(rangs[0], "").replace("*", "");
                            // console.log(stock);
                            if (contains(ignoredStocks, stock.code)) { //已经退市或者不存在
                                return false;
                            }
                            datas.push(stock);
                        }
                    })

                    // as.forEach(a => datas.push($(a).text()));
                    resolve(datas);
                } else {
                    reject(response)
                }
            });
        } catch (e) {
            reject(e);
        }
    });

}

function contains(array, obj) {
    for (var i = 0; i < array.length; i++) {
        if (array[i] == obj) {
            return true;
        }
    }
    return false;
}

stocklist().then(result => {
    // console.log(".......");
    // result.forEach(r => console.log(r))
    // console.log(result.length);

    fs.writeFile("src/finance-data/all-stock-codes.json", JSON.stringify(result),
        err => {
            if (err) {
                console.log("ERROR:", err);
                return false;
            }
            console.log("OK");
        });
}).catch(e => console.log(e));