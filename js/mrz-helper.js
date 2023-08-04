let row1Pattern = /P[A-Z0-9<][A-Z]{3}([A-Z0-9<]{39})/g;
let row2Pattern = /([A-Z0-9][A-Z0-9<]{8})[0-9]([A-Z]{3})([0-9]{6})[0-9][MF<]([0-9]{6})[0-9][A-Z0-9<]{14}[0-9<][0-9]/g;

function getMRZCode(ocrText) {
    let result = [];
    let ocrTextList = ocrText.split("\n");
    let index = ocrTextList.length - 1;

    // 2번째 줄의 MRZ 찾기
    for (let i = index; i >= 0; i--) {
        let row2 = ocrTextList[i].replace(/\s/g, '').match(row2Pattern);

        if (row2 != null) {
            result[1] = row2[0];
            index = i;
            break;
        }
    }

    // 1번째 줄의 MRZ 찾기
    if (result[1] != undefined) {
        for(let j = index - 1;  j >= 0; j--) {
            let row1 = ocrTextList[j].replace(/\s/g, '').match(row1Pattern);
            
            if(row1 != null) {
                result[0] = row1[0];
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