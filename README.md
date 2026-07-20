# 나의 취업 서류 만들기

취업 준비생이 브라우저에서 이력서와 자기소개서를 작성하고 PDF로 저장할 수 있는
정적 웹사이트입니다.

## 주요 특징

- 설치와 회원가입 없이 사용
- 입력 내용과 증명사진을 현재 브라우저에 자동 저장
- 필요한 항목만 선택 작성
- 생년월일과 증명사진을 포함한 기본 정보 구성
- 기본 문항 수정·삭제와 커스텀 문항 추가가 가능한 자기소개서
- 화면에서 바로 열어볼 수 있는 단계별 사용 설명서
- 실시간 완성 문서 미리보기
- 5가지 문서 레이아웃
- 섹션 순서·여백·간격·제목 정렬·구분선 수동 편집
- 프로젝트별 16:9 썸네일과 클릭 가능한 출시 링크
- 프로젝트별 주요 기여와 선택형 회고 작성
- 작성량에 맞춘 A4 페이지 자동 분할과 페이지 번호
- 인쇄 기능을 이용한 PDF 저장
- 문구·구분선·배경·이미지를 개별 객체로 수정할 수 있는 A4 PPTX 저장
- Figma에서 가져올 수 있는 편집형 SVG 저장
- 서버로 개인정보를 전송하지 않는 순수 HTML/CSS/JavaScript 구성

## 로컬 실행

`index.html`을 브라우저에서 열면 바로 사용할 수 있습니다.

## GitHub Pages 배포

이 폴더를 하나의 GitHub 저장소로 사용합니다.

1. GitHub에서 빈 저장소를 만듭니다.
2. 아래 명령의 주소를 새 저장소 주소로 바꿔 실행합니다.

```bash
git remote add origin https://github.com/USERNAME/REPOSITORY.git
git add .
git commit -m "Set up job document builder"
git push -u origin main
```

3. GitHub 저장소의 `Settings → Pages`에서 Source를 `GitHub Actions`로 선택합니다.
4. `Deploy GitHub Pages` 워크플로가 끝나면 표시되는 Pages 주소로 접속합니다.

이후 `main` 브랜치에 변경사항을 push하면 자동으로 다시 배포됩니다.

## 개인정보 안내

작성한 개인정보와 사진은 브라우저의 localStorage에만 저장됩니다. 공용 PC에서는
사용 후 `처음부터 다시` 버튼으로 내용을 지워 주세요.

## 포함 라이브러리

PPTX 출력에는 MIT 라이선스의 PptxGenJS 4.0.1 브라우저 번들을 저장소에 포함해
사용합니다. 외부 CDN에는 연결하지 않습니다.
