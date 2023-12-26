## `mrz-scanner.js` 사용법

`mrz-scanner.js` 스크립트는 여권 이미지에서 MRZ 텍스트 추출할 때 사용됩니다. 이미지 전처리에는 opencv.js가 사용되었고, OCR에는 tesseract.js가 사용되었습니다. 사용된 tessdata는 mrz 폰트(OCR-B)로 훈련되었습니다.

mrz.traineddata.gz: https://github.com/DoubangoTelecom/tesseractMRZ

### 1단계: 스크립트 포함
`mrz-scanner.js` 및 필요한 외부 스크립트를 HTML 파일에 포함:

```html
<!-- 외부 스크립트 -->
<script src='js/external/tesseract-4.1.4.min.js'></script>
<script src="js/external/davidshimjs-qrcode-0.0.2.min.js"></script>
<script src="js/external/opencv-4.8.0.min.js"></script>

<!-- mrz-scanner.js -->
<script src="js/custom/mrz-scanner.js"></script>
```

### 2단계: HTML 태그 추가
예제에서 사용한 태그

- 파일 업로드를 위한 `<input>`
- 업로드된 여권 이미지를 저장할 `<img>`
- 추출된 MRZ 텍스트를 표시할 `<textarea>`

예시:
```html
<input type="file" id="fileInput" />
<img id="passportImage" />
<div id="extractedText"></div>
```

### 3단계: 이미지 업로드 처리 및 초기화
이미지 업로드에 대한 이벤트 리스너를 설정:

```javascript
document.getElementById('fileInput').addEventListener('change', handleImageUpload);

function handleImageUpload(event) {
    const file = event.target.files[0];
    const imgElement = document.getElementById('passportImage');
    imgElement.src = URL.createObjectURL(file);
    document.getElementById('extractedText').innerText = "";
}
```

### 4단계: 이미지 로드 시 처리
이미지가 완전히 로드될 때 이미지를 처리하기 위한 이벤트 리스너를 이미지 요소에 추가:

```javascript
document.getElementById('passportImage').addEventListener('load', handleImageLoaded);

function handleImageLoaded() {
    // MRZScanner 클래스를 초기화할 때 테서렉트 모델의 디렉토리 경로가 필요합니다.
    const mrzScanner = new MRZScanner('테서랙트 모델 디렉토리 경로');

    // 이미지에서 MRZ 추출
    mrzScanner.extractMRZ('passportImage').then(mrz => {
        document.getElementById('extractedText').value = mrz.join("\n");
    }).catch(error => {
        console.error("MRZ 추출 중 오류 발생: ", error);
    });
}
```
<b>`extractMRZ` 메서드</b>

메서드 파라미터: extractMRZ 메서드는 이미지 태그의 id 값을 파라미터로 받습니다.

반환 형태: extractMRZ 메서드는 String[2] 형태의 배열을 반환합니다.

- mrz[0]: MRZ의 첫 번째 행 (row 1)  
- mrz[1]: MRZ의 두 번째 행 (row 2)

---