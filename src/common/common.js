let fs = require('fs');

module.exports.mkdir = function(path) {
    if (!fs.existsSync(path)) {
        fs.mkdirSync(path);
    }
}

module.exports.transposeMatrix = function(matrixData) {
    var i, j,
        rowLen = matrixData.length,
        colLen = matrixData[0].length,
        result = new Array(colLen);

    for (i = 0; i < colLen; i++) {
        result[i] = new Array(rowLen);
        for (j = 0; j < rowLen; j++) {
            result[i][j] = matrixData[j][i];
        }
    }

    return result;
}

module.exports.getBasePathP = function(stock) {
    let basepath = [];
    let path;
    basepath.push("excels");
    path = basepath.join("/");
    this.mkdir(path);

    basepath.push(stock.name + "_" + stock.code);
    path = basepath.join("/");
    this.mkdir(path);

    return path;
}

module.exports.sleep = function(delay) {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            resolve();
        }, delay);
    });
}