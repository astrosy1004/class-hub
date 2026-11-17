/* ============================================================
   수업 전시실 데이터 — [수도전기] 라즈봇 & 앱인벤터 패들렛 정리
   원본: https://padlet.com/astrosy/padlet-258mda45apjj954w
   ※ 학생 이름/학번, 공유기·계정 비밀번호는 공개 페이지에 싣지 않았습니다.
   ※ 패들렛 첨부파일 링크는 만료되므로 넣지 않고, 파일은 패들렛 원본에서 받습니다.
   items: { h:제목, b:설명(줄바꿈 가능), code:명령/코드(선택), tag:분류(선택) }
   ============================================================ */
const CLASS_INFO = {
  title: "라즈봇 & 앱인벤터",
  org: "[수도전기]",
  sub: "라즈베리파이 5 라즈봇(Raspbot) 자동차를 파이썬과 앱인벤터로 제어하는 수업",
  padlet: "https://padlet.com/astrosy/padlet-258mda45apjj954w",
  accent: "#0b8f6a",
  stats: [
    { n: "24", l: "패들렛 섹션" },
    { n: "150+", l: "수업 게시물" },
    { n: "2", l: "학급 (5반 · 6반)" },
    { n: "7", l: "단계별 미션" },
  ],
  keywords: ["라즈베리파이 5", "Raspbot", "파이썬", "앱인벤터", "블루투스", "OpenCV", "Flask", "라인트레이싱", "초음파센서", "바이브 코딩"],
  /* 오른쪽 벽 미션 진행표: topic = TOPICS 의 번호(0부터) */
  board: [
    { name: "블루투스 조종", c5: "미션2", c6: "미션1", topic: 2 },
    { name: "얼굴 추적 자동차", c5: "미션1", c6: "미션2", topic: 3 },
    { name: "라인트레이싱", c5: "미션3", c6: "미션3 · 3-1", topic: 4 },
    { name: "날씨 API · 부저", c5: "미션4", c6: "—", topic: 5 },
    { name: "Flask 웹 조종기", c5: "미션5 · 6 · 7", c6: "미션4", topic: 5 },
  ],
};

const TOPICS = [
  {
    no: "01", title: "환경 설정 · 원격 접속", icon: "chip",
    summary: "OS 설치부터 VNC 원격 접속, 가상환경·OpenCV 설치까지",
    steps: [
      "이미지를 내려받아 Raspberry Pi Imager 로 SD카드에 설치",
      "Advanced IP Scanner 로 라즈봇 IP 확인",
      "무선 핫스팟에 연결하고 VNC Viewer 로 원격 접속 (PuTTY · WinSCP 병행)",
      "I2C 활성화 → 가상환경(venv) 만들기 → OpenCV 설치",
    ],
    items: [
      { tag: "원격 접속", h: "원격 접속 순서", b: "① 무선 공유기(핫스팟)를 PC에 연결\n② SD카드 이름으로 네트워크 설정\n③ 자동차에 SD카드를 꽂고 전원 켜기\n④ VNC Viewer 에 핫스팟 IP 를 입력해 연결\n(계정 정보는 수업 시간에 안내)" },
      { tag: "원격 접속", h: "VNC 서버 설정", b: "VNC 설치 후 서비스를 켜고, raspi-config 에서 X11 로 바꾼 뒤 재부팅합니다.", code: "sudo apt install realvnc-vnc-server realvnc-vnc-viewer -y\nsudo systemctl enable vncserver-x11-serviced.service\nsudo raspi-config   # Advanced Options → X11 → 재부팅" },
      { tag: "가상환경", h: "가상환경 만들기", b: "학번 폴더에서 터미널을 열고 가상환경을 만듭니다. (I2C 는 먼저 enable)", code: "python -m venv --system-site-packages venv" },
      { tag: "가상환경", h: "OpenCV 설치", b: "numpy 버전 오류가 나면 아래 두 번째 명령을 실행합니다.", code: "pip install opencv-python==4.11.0.86\npip install numpy==1.24.2" },
      { tag: "오류 해결", h: "OpenCV 에러 수정", b: "카메라/OpenCV 실행 중 오류가 날 때 사용합니다.", code: "sudo pip3 install simplejpeg==1.7.6 --break-system-packages --force-reinstall" },
      { tag: "핸드폰", h: "핸드폰 제어", b: "전용 앱을 설치하고 라즈봇 WIFI 에 연결해 조종합니다." },
    ],
    links: [
      { t: "시스템 이미지 (Google Drive)", u: "https://drive.google.com/drive/folders/1DnBK3EDcRDnJWq3NZ0YMipqqyHYG-WF6" },
      { t: "Raspberry Pi Imager", u: "https://www.raspberrypi.com/software/" },
      { t: "Advanced IP Scanner", u: "https://www.advanced-ip-scanner.com/download/" },
      { t: "라즈봇 제품 페이지", u: "https://www.icbanq.com/P016883920" },
    ],
  },
  {
    no: "02", title: "기초 하드웨어 실습", icon: "motor",
    summary: "모터 · 서보 · 부저 · 초음파센서를 하나씩 움직여 보기",
    steps: [
      "YB_Pcb_Car.py 라이브러리로 주행·서보모터 제어",
      "부저(GPIO 26)로 음 내기와 노래 연주",
      "초음파센서로 거리 측정, 초음파 피아노 미션",
    ],
    items: [
      { tag: "모터", h: "모터 라이브러리 · 테스트", b: "자동차 움직임 클래스 YB_Pcb_Car.py 와 예제 drive_motor 로 기본 주행을 테스트합니다." },
      { tag: "모터", h: "미션1 · 기본 주행 테스트", b: "전진 · 후진 · 좌우 회전을 직접 코딩해 확인합니다." },
      { tag: "모터", h: "미션2 · 서보모터 기본 동작", b: "카메라가 달린 서보모터를 좌우 · 위아래로 움직입니다." },
      { tag: "부저", h: "부저 실습", b: "buzzer.py 로 소리를 내고, buzzor_song.py 로 멜로디를 연주합니다." },
      { tag: "초음파", h: "초음파센서 기본", b: "ulltrasonic.py 로 앞 물체까지의 거리를 읽습니다." },
      { tag: "초음파", h: "미션 · 초음파 피아노", b: "손과의 거리에 따라 다른 음이 나는 피아노를 만듭니다." },
    ],
    links: [{ t: "Yahboom 라즈봇 교육자료", u: "https://www.yahboom.net/study/Raspbot" }],
  },
  {
    no: "03", title: "블루투스 · 앱인벤터", icon: "ir",
    summary: "스마트폰 앱에서 블루투스로 자동차를 조종하기",
    steps: [
      "환경설정에서 시리얼 통신 enable 후 재부팅",
      "AT 명령으로 블루투스 모듈 이름 변경 (9600 baud)",
      "앱인벤터에서 블루투스 연결 + 버튼 신호 전송",
      "라즈베리파이가 신호를 받아 자동차 제어, 센서값은 앱으로 회신",
    ],
    items: [
      { tag: "연동", h: "1. 블루투스 이름 변경", b: "/dev/serial0 를 9600 baud 로 열고 AT 명령을 보내 모듈 이름을 바꿉니다." },
      { tag: "연동", h: "2. 앱인벤터 연동", b: "SUDO_BT 프로젝트(.aia)로 블루투스 연결과 버튼 전송을 구성합니다." },
      { tag: "연동", h: "3. 라즈베리파이 수신 코드", b: "ble_recv.py 가 앱에서 온 글자를 읽어 명령으로 해석합니다.", code: "bleSerial = serial.Serial(\"/dev/serial0\", baudrate=9600, timeout=1.0)\ndata = bleSerial.readline()" },
      { tag: "연동", h: "4. 초음파센서값 → 앱으로 전송", b: "DistanceSensor(echo=24, trigger=23) 값을 블루투스로 보내 앱 레이블에 표시합니다." },
      { tag: "연동", h: "5. 앱인벤터 데이터 수신", b: "레이블_수신결과 와 시계(Clock) 컴포넌트를 추가해 값을 주기적으로 표시합니다." },
      { tag: "미션", h: "미션 · 블루투스 조종기 (5반 미션2 · 6반 미션1)", b: "생성형 AI로 바이브 코딩해 만듭니다.\n1 전진 · 2 후진 · 3 좌회전 · 4 우회전 · 5 정지\n두 학급 모두 대부분 통과했습니다." },
      { tag: "추가미션", h: "서보 연동 조건", b: "전진할 때 서보 위, 후진할 때 아래, 정지하면 중앙으로 이동하게 확장합니다." },
    ],
    links: [],
  },
  {
    no: "04", title: "카메라 · 얼굴 인식", icon: "robot",
    summary: "OpenCV로 얼굴을 찾아 따라가는 자동차",
    steps: [
      "picamera2 로 영상을 받고 OpenCV Haar Cascade 로 얼굴 검출",
      "얼굴 중심이 화면 가운데 범위를 벗어나면 좌/우로 회전",
      "가운데에 있으면 전진 · 얼굴이 없으면 정지",
    ],
    items: [
      { tag: "환경", h: "한글 OS 추가 설치", b: "한글 OS 에서 카메라 라이브러리를 맞추는 명령입니다.", code: "sudo apt update\nsudo apt install -y rpicam-apps\npython3 -m pip uninstall numpy simplejpeg -y\nsudo apt install --reinstall -y python3-numpy python3-simplejpeg python3-picamera2" },
      { tag: "예제", h: "비디오 인식 · 얼굴 인식 소스", b: "03opencv_video2_RGB 로 영상을 확인하고, 얼굴 인식 예제 코드로 검출 결과를 화면에 표시합니다." },
      { tag: "바이브 코딩", h: "AI 프롬프트 예시", b: "“YB_Pcb_Car.py 와 얼굴인식 소스를 참고해서, 라즈베리파이에서 OpenCV 얼굴 인식으로 인식된 얼굴을 자동차가 쫓아가는 파이썬 코드를 작성해줘.”" },
      { tag: "미션", h: "5반 미션1 · 6반 미션2 — 얼굴 따라 이동", b: "06VisionFaceDetect 와 drive_motor 를 참고해 follow me 기능을 완성합니다." },
    ],
    links: [],
  },
  {
    no: "05", title: "라인트레이싱", icon: "line",
    summary: "4채널 라인 센서로 검은 선을 따라가는 주행",
    steps: [
      "라인 센서 4개를 GPIO 입력으로 읽기 (핀맵 참고)",
      "센서 조합에 따라 직진 · 좌/우 보정 · 정지 결정",
      "추가 미션: 초음파가 가까운 장애물을 감지하면 우회",
    ],
    items: [
      { tag: "하드웨어", h: "핀맵 · 센서 구성", b: "왼쪽 바깥 GPIO 27 · 왼쪽 안쪽 22 · 오른쪽 안쪽 17 · 오른쪽 바깥 4", code: "LEFT_OUTER=27  LEFT_INNER=22\nRIGHT_INNER=17 RIGHT_OUTER=4" },
      { tag: "원리", h: "라인트레이싱 원리", b: "검은 선 위의 센서 값이 달라지는 것을 이용해 선이 왼쪽이면 왼쪽으로, 오른쪽이면 오른쪽으로 조향합니다." },
      { tag: "실습", h: "라인 센서 테스트", b: "4개 센서 값을 반복 출력해 선 위/밖에서 값이 어떻게 변하는지 확인합니다." },
      { tag: "미션", h: "미션3 — 라인트레이싱 기능 구현 (5반·6반)", b: "각자 센서 조건과 속도를 조정해 트랙을 완주합니다." },
      { tag: "추가미션", h: "미션3-1 — 장애물 우회", b: "초음파센서(Trig GPIO 4, Echo 5)가 7cm 보다 가까워지면 우회 로직을 실행합니다.\n후진 1초 → 대기 → 좌회전" },
    ],
    links: [],
  },
  {
    no: "06", title: "Flask 웹 · API", icon: "matrix",
    summary: "웹페이지로 자동차를 조종하고 날씨 API를 활용하기",
    steps: [
      "Flask 라이브러리로 웹 서버를 만들고 브라우저에서 접속",
      "날씨 API 호출 → 온도 판단 → 부저 멜로디",
      "웹 조종기: 이동 · 카메라 서보 · 실시간 영상 · 색상 추적",
    ],
    items: [
      { tag: "API", h: "날씨 API 호출 (Open-Meteo)", b: "위도 · 경도로 현재 날씨와 일 최고/최저 기온을 JSON 으로 받아옵니다." },
      { tag: "미션", h: "5반 미션4 — 온도 알림", b: "제주 · 도쿄의 위도/경도로 온도를 조회해 결과 페이지에 출력하고,\n온도가 25도 이상이면 부저(GPIO 26)로 1초 멜로디를 연주합니다." },
      { tag: "미션", h: "5반 미션5 — 웹 피아노", b: "가상환경에 라이브러리를 설치하고 Flask 웹페이지에 피아노 건반을 만들어 26번 부저를 연주합니다." },
      { tag: "미션", h: "5반 미션6 · 6반 미션4 — 웹 조종기", b: "전후좌우 조종 + 카메라 서보모터 좌우·위아래 조종 + 조종 화면에 카메라 영상 표시\n(조이스틱 이동, OpenCV 없이 카메라 구현 등 개별 확장도 진행)" },
      { tag: "미션", h: "5반 미션7 — 색상 추적", b: "색상 인식 후 추적 기능 버튼을 웹 조종기에 추가합니다." },
      { tag: "아이디어", h: "디자인 확장", b: "닌텐도 스타일 조종기, 미래 스타일 버튼 등 AI에게 디자인을 요청해 꾸며 봅니다." },
    ],
    links: [
      { t: "Flask 공식 문서", u: "https://flask.palletsprojects.com/en/stable/" },
      { t: "날씨 API 호출 예시 (서울)", u: "https://api.open-meteo.com/v1/forecast?latitude=37.5665&longitude=126.9780&current_weather=true&daily=temperature_2m_max,temperature_2m_min&timezone=Asia/Seoul" },
    ],
  },
  {
    no: "07", title: "시험 · 프로젝트", icon: "chip",
    summary: "중간·기말고사 대비 자료와 프로젝트 영상",
    steps: ["앱인벤터 교안과 확장 기능(LookExtension)으로 중간고사 대비", "라즈베리파이 리뷰 자료로 기말고사 대비"],
    items: [
      { tag: "중간고사", h: "앱인벤터 교안 (PDF) · LookExtension.aix", b: "26년 1학기 앱인벤터 교안과 확장 파일이 패들렛에 있습니다." },
      { tag: "기말고사", h: "라즈베리파이 리뷰 V2 (PDF)", b: "라즈베리파이 · 센서 · 파이썬 실습 내용을 정리한 복습 자료입니다." },
      { tag: "프로젝트", h: "프로젝트 영상 — 2025 1조", b: "지난 프로젝트 사례 영상을 패들렛에서 볼 수 있습니다." },
    ],
    links: [],
  },
];
