from enum import Enum


class LanguageCode(Enum):
    THAI = "th-th"
    CHINESE_SIMPLIFIED = "zh-cn"
    CHINESE_TRADITIONAL = "zh-tw"
    RUSSIAN = "ru-ru"
    INDONESIAN = "id-id"
    KOREAN = "ko-kr"
    VIETNAMESE = "vi-vn"
    ITALIAN = "it-it"
    JAPANESE = "ja-jp"
    PORTUGUESE = "pt-pt"
    TURKISH = "tr-tr"
    ENGLISH = "en-us"
    GERMAN = "de-de"
    FRENCH = "fr-fr"
    SPANISH = "es-es"


LANGUAGE_CODE_TO_DIR = {
    LanguageCode.THAI: "TH",
    LanguageCode.CHINESE_SIMPLIFIED: "ZH-S",
    LanguageCode.CHINESE_TRADITIONAL: "ZH-T",
    LanguageCode.RUSSIAN: "RU",
    LanguageCode.INDONESIAN: "ID",
    LanguageCode.KOREAN: "KO",
    LanguageCode.VIETNAMESE: "VI",
    LanguageCode.ITALIAN: "IT",
    LanguageCode.JAPANESE: "JA",
    LanguageCode.PORTUGUESE: "PT",
    LanguageCode.TURKISH: "TR",
    LanguageCode.ENGLISH: "EN",
    LanguageCode.GERMAN: "DE",
    LanguageCode.FRENCH: "FR",
    LanguageCode.SPANISH: "ES",
}
