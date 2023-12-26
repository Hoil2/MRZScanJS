class MRZScanner {

    static row1Pattern = /P[A-Z0-9<][A-Z<]{3}([A-Z0-9<]{39})/g;
    static row2Pattern = /([A-Z0-9][A-Z0-9<]{8})[0-9]([A-Z<]{3})([0-9]{6})[0-9][MF<]([0-9]{6})[0-9][A-Z0-9<]{14}[0-9<][0-9]/g;

    static async extractMRZ(id) {
        const imgElement = document.getElementById(id);
        if (!imgElement) {
            console.error('Image element not found.');
            return Promise.reject('Image element not found.');
        }

        if (!imgElement.complete) {
            await new Promise(resolve => imgElement.onload = resolve);
        }

        try {
            return this.processImage(imgElement);
        } catch (error) {
            console.error('Error processing MRZ:', error);
            return Promise.reject(error);
        }
    }

    static async processImage(imgElement) {
        let src, dst, dsize, rgb_planes, result_norm_planes, result_norm, result_norm_vector, img_rgb, blurred, ksize, sharpened, img_bgr, bilateralFilterImg, adjustedImgElement;
        
        try {
            src = cv.imread(imgElement.id);
            dst = new cv.Mat();

            // 이미지 리사이즈
            dsize = this.getSize(imgElement.naturalWidth, imgElement.naturalHeight, 1600);
            cv.resize(src, dst, dsize, 0, 0, cv.INTER_AREA);

            rgb_planes = new cv.MatVector();
            cv.split(dst, rgb_planes);

            result_norm_planes = [];

            for (let i = 0; i < 3; i++) {
                let plane = rgb_planes.get(i);
                let dilated_img = new cv.Mat();
                let dilated_kernel = cv.Mat.ones(7, 7, cv.CV_8U);
                cv.dilate(plane, dilated_img, dilated_kernel);

                let bg_img = new cv.Mat();
                cv.medianBlur(dilated_img, bg_img, 21);

                let diff_img = new cv.Mat();
                cv.absdiff(plane, bg_img, diff_img);

                let scalar = new cv.Mat(plane.rows, plane.cols, plane.type(), new cv.Scalar(255, 255, 255));
                cv.subtract(scalar, diff_img, diff_img);

                let norm_img = new cv.Mat();
                cv.normalize(diff_img, norm_img, 0, 255, cv.NORM_MINMAX, cv.CV_8UC1);

                result_norm_planes.push(norm_img);

                plane.delete();
                dilated_img.delete();
                dilated_kernel.delete();
                bg_img.delete();
                scalar.delete();
                diff_img.delete();
            }

            result_norm = new cv.Mat();
            result_norm_vector = new cv.MatVector();
            for (let i = 0; i < result_norm_planes.length; i++) {
                result_norm_vector.push_back(result_norm_planes[i]);
            }

            cv.merge(result_norm_vector, result_norm);

            img_rgb = new cv.Mat();
            cv.cvtColor(result_norm, img_rgb, cv.COLOR_BGR2RGB);

            blurred = new cv.Mat();
            ksize = new cv.Size(0, 0);
            cv.GaussianBlur(img_rgb, blurred, ksize, 3, 3, cv.BORDER_DEFAULT);

            sharpened = new cv.Mat();
            let alpha = 2.5, beta = -1.5, gamma = 0;
            cv.addWeighted(img_rgb, alpha, blurred, beta, gamma, sharpened);

            img_bgr = new cv.Mat();
            cv.cvtColor(sharpened, img_bgr, cv.COLOR_RGB2BGR);

            bilateralFilterImg = new cv.Mat();
            cv.bilateralFilter(img_bgr, bilateralFilterImg, 9, 150, 5, cv.BORDER_DEFAULT);

            // 임시 캔버스 생성
            adjustedImgElement = document.createElement('canvas');
            adjustedImgElement.id = 'adjusted-img';
            adjustedImgElement.style = "visibility: hidden;"
            document.body.appendChild(adjustedImgElement);

            // 이미지를 임시 캔버스에 그리
            cv.imshow('adjusted-img', bilateralFilterImg);

            // Tesseract OCR 처리
            const { data } = await Tesseract.recognize(adjustedImgElement.toDataURL(), 'mrz', { langPath: 'model' });

            // 결과 처리
            let textRanges = data.lines.map(line => ({
                text: line.text,
                bbox: line.bbox
            })).filter(item => item.text.replace(/\s/g, '').length >= 44);

            let mrz = this.getMRZCode(textRanges);

            return mrz; // 추출된 MRZ 데이터 반환
        } catch (error) {
            console.error('Error in Tesseract OCR:', error);
            throw error;
        } finally {
            // 메모리 해제
            src && src.delete();
            dst && dst.delete();
            rgb_planes && rgb_planes.delete();
            result_norm && result_norm.delete();
            result_norm_vector && result_norm_vector.delete();
            result_norm_planes.forEach(p => p && p.delete());
            img_rgb && img_rgb.delete();
            blurred && blurred.delete();
            sharpened && sharpened.delete();
            img_bgr && img_bgr.delete();
            bilateralFilterImg && bilateralFilterImg.delete();
            adjustedImgElement && adjustedImgElement.remove();
        }
    }

    // 이미지의 크기를 조정하는 함수
    static getSize(nowWidth, nowHeight, dimension) {
        let ratio = 1;

        // 더 큰 쪽의 크기를 기준으로 비율 계산
        if (nowWidth >= nowHeight) {
            ratio = dimension / nowWidth;
        } else {
            ratio = dimension / nowHeight;
        }
        ratio = (ratio > 1) ? 1 : ratio;

        let width = nowWidth * ratio;
        let height = nowHeight * ratio;

        return new cv.Size(Math.round(width), Math.round(height));
    }

    static getMRZCode(textRanges) {
        let result = [];
        let index = textRanges.length - 1;
        

        // 2번째 줄의 MRZ 찾기
        for (let i = index; i >= 0; i--) {
            let row2 = textRanges[i].text.replace(/\s/g, '').match(MRZScanner.row2Pattern);

            if (row2 != null) {
                result[1] = row2[0];
                index = i;
                break;
            }
        }

        // 1번째 줄의 MRZ 찾기
        if (result[1] != undefined) {
            for(let j = index - 1;  j >= 0; j--) {
                let row1 = textRanges[j].text.replace(/\s/g, '').match(MRZScanner.row1Pattern);
                
                if(row1 != null) {
                    result[0] = row1[0];
                    break;
                }
            }
        }

        return result;
    }
}