// 공유 전담 파일: 공유 링크 만들기 · 링크 복사 · QR코드 · 휴대폰 공유 창(카카오톡 등).

// QR코드 라이브러리는 "QR코드 생성"을 눌렀을 때만 불러온다 (첫 화면 로딩을 가볍게).
const QR_LIB_URL = "https://cdn.jsdelivr.net/npm/qrcode-generator@1.4.4/qrcode.js";

/**
 * 이 지역의 안전수칙 화면을 바로 여는 링크. 받는 사람이 열면 같은 지역을 조회한 뒤 안전수칙을 보여준다.
 * @param {object} place
 * @param {string} label 화면에 보일 지역 이름
 */
export function buildShareUrl(place, label) {
  const url = new URL(location.pathname, location.origin);
  url.searchParams.set("lat", place.latitude.toFixed(4));
  url.searchParams.set("lon", place.longitude.toFixed(4));
  url.searchParams.set("name", label);
  url.hash = "rules";
  return url.toString();
}

/**
 * 공유 메시지 본문. 카카오톡·문자로 보낼 때 링크 앞에 붙는다.
 * @param {string} label 지역 이름
 * @param {string} weatherLine 예: "맑음 24℃"
 * @param {string[]} hazardLines 예: ["☀️ 더위 경고"]
 * @param {string[]} topRules 가장 중요한 안전수칙 제목 몇 개
 */
export function buildShareText(label, weatherLine, hazardLines, topRules) {
  const lines = [`[현장 날씨 안전도우미] ${label}`, `오늘 날씨: ${weatherLine}`];
  lines.push(hazardLines.length ? `주의할 기상: ${hazardLines.join(", ")}` : "특별한 기상 위험 없음");
  if (topRules.length) {
    lines.push(`오늘의 안전수칙: ${topRules.join(" · ")}`);
  }
  return lines.join("\n");
}

export async function copyText(text) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }
  // clipboard API를 못 쓰는 환경(오래된 브라우저 등)을 위한 대체 방법
  const ta = document.createElement("textarea");
  ta.value = text;
  ta.setAttribute("readonly", "");
  ta.style.position = "fixed";
  ta.style.opacity = "0";
  document.body.appendChild(ta);
  ta.select();
  const ok = document.execCommand("copy");
  ta.remove();
  if (!ok) throw new Error("복사 실패");
}

/**
 * 휴대폰의 공유 창을 연다 (카카오톡, 문자 등 설치된 앱으로 보낼 수 있다).
 * 공유 창이 없는 환경(대부분의 PC 브라우저)에서는 메시지+링크를 복사한다.
 * @returns {Promise<"shared"|"copied"|"cancelled">}
 */
export async function shareNative(title, text, url) {
  if (navigator.share) {
    try {
      await navigator.share({ title, text, url });
      return "shared";
    } catch (err) {
      if (err.name === "AbortError") return "cancelled";
      // 공유 창 자체가 실패하면 복사로 대신한다
    }
  }
  await copyText(`${text}\n${url}`);
  return "copied";
}

let qrLibPromise = null;

function loadQrLib() {
  if (window.qrcode) return Promise.resolve(window.qrcode);
  if (!qrLibPromise) {
    qrLibPromise = new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = QR_LIB_URL;
      script.onload = () => resolve(window.qrcode);
      script.onerror = () => {
        qrLibPromise = null;
        reject(new Error("QR코드 라이브러리를 불러오지 못했습니다"));
      };
      document.head.appendChild(script);
    });
  }
  return qrLibPromise;
}

/**
 * url을 담은 QR코드를 el 안에 SVG로 그린다.
 * @param {HTMLElement} el
 * @param {string} url
 */
export async function renderQrCode(el, url) {
  const qrcode = await loadQrLib();
  const qr = qrcode(0, "M"); // 0 = 길이에 맞춰 크기 자동, M = 오류 복원 15%
  qr.addData(url);
  qr.make();
  el.innerHTML = qr.createSvgTag({ cellSize: 4, margin: 2, scalable: true });
}
