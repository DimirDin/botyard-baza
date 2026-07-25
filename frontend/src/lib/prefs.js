const KEY = "baza:ambient";

// Живой фон включён по умолчанию. Выключенным считаем только явное "0" —
// любой мусор в хранилище трактуем как «включено», чтобы сломанное
// значение не отбирало у человека оформление молча.
export function getAmbientEnabled() {
  try {
    return localStorage.getItem(KEY) !== "0";
  } catch {
    return true;
  }
}

export function setAmbientEnabled(value) {
  try {
    localStorage.setItem(KEY, value ? "1" : "0");
  } catch {
    // приватный режим — настройка просто не переживёт сессию
  }
}
