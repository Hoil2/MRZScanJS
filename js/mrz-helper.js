let row1Pattern = /P[A-Z0-9<][A-Z]{3}([A-Z0-9<]{39})/g;
let row1ValidationPattern = /P[A-Z0-9<][A-Z]{3}(?=.*<<)([A-Z0-9<]{39})/g;
let row2Pattern = /([A-Z0-9][A-Z0-9<]{8})[0-9]([A-Z]{3})([0-9]{6})[0-9][MF<]([0-9]{6})[0-9][A-Z0-9<]{14}[0-9<][0-9]/g;

function getMRZCode(ocrText) {
    let result = [];

    ocrText = ocrText.replace(/\s/g, "");

    // 2번째 줄의 MRZ 찾기
    let row2 = ocrText.match(row2Pattern);

    if (row2 != null) {
        result[1] = row2[0];
        let matchIndex = ocrText.indexOf(row2[0]);
        ocrText = ocrText.substring(0, matchIndex);
    }

    // 1번째 줄의 MRZ 찾기
    if (result[1] != undefined) {
        let row1 = ocrText.match(row1Pattern);
        
        if(row1 != null) {
            for(let i = row1.length - 1; i >= 0; i--) {
                if(row1[i].match(row1ValidationPattern) != null) {
                    result[0] = row1[i];
                    break;
                }
            }
        }
    }

    if (result[0] == undefined || result[1] == undefined) {
        return null;
    }

    return result;
}


function checkExecutionTime(func) {
    const startTime = performance.now();
    func();
    const endTime = performance.now();
    const executionTime = endTime - startTime;
    console.log(`Execution time: ${executionTime} milliseconds`);
  }